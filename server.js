require("dotenv").config();
const express = require("express");
const BodyParser = require("body-parser");
const app = express();
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const flash = require("express-flash");
const passport = require("passport");
const expressSession = require("express-session");
const { hash } = require("bcryptjs");
const prisma = require("./prisma");
const methodOverride = require("method-override");
const {
  localStrategy,
  deserializeUser,
  serializeUser,
} = require("./config/passport");
const bodyParser = require("body-parser");
const {
  checkNotAuthenticate,
  checkAuthenticate,
} = require("./middlewares/auth.local");

// Server
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// BodyParser
app.use(bodyParser.json());
app.use(BodyParser.urlencoded({ extended: false }));

// View Engine
app.use(flash());
app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Express Session
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Method Override
app.use(methodOverride("_method"));

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use("local", localStrategy);
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

// Routes

// Home -> /
app.get("/", checkAuthenticate, async (req, res) => {
  const { search } = req.query;

  const seo = {
    title: "Home / Realtime Chat",
  };

  const whereFilter = {};

  if (typeof search !== "undefined") {
    whereFilter.name = {
      contains: search,
    };
  }

  const dataRooms = await prisma.room.findMany({
    where: whereFilter,
    include: {
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      id: req.user.id,
    },
    include: {
      participants: {
        select: {
          roomId: true,
        },
      },
    },
  });

  res.render("pages/home", {
    ...seo,
    layout: "layout/private",
    dataRooms,
    user,
    search,
  });
});

// Room Chat -> /room/:id
app
  .route("/room/:id")
  .get(checkAuthenticate, async (req, res) => {
    const { id } = req.params;

    const fields = {
      layout: "layout/private",
    };

    const existingRoom = await prisma.room.findFirst({
      where: { id },
      include: {
        messages: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (existingRoom) {
      fields.title = `${existingRoom.name} / Realtime Chat`;
    } else {
      res.redirect("/");
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
      include: {
        participants: {
          select: {
            roomId: true,
          },
        },
      },
    });

    const isUserParticipantInExistingRoom = user.participants.some(
      ({ roomId }) => roomId === existingRoom.id
    );

    if (!isUserParticipantInExistingRoom) {
      res.redirect("/");
      return;
    }

    res.render("pages/room", {
      ...fields,
      room: existingRoom,
      user: req.user,
    });
  })
  .post(checkAuthenticate, async (req, res) => {
    const { id } = req.params;

    const existingRoom = await prisma.room.findFirst({
      where: { id },
    });

    if (!existingRoom) {
      res.redirect("/");
      return;
    }

    await prisma.participant.create({
      data: {
        role: "User",
        userId: req.user.id,
        roomId: id,
      },
    });

    res.redirect(`/room/${id}`);
  });

// Create Group -> /create-group
app
  .route("/create-group")
  .get(checkAuthenticate, (req, res) => {
    const seo = {
      title: "Create Group / Realtime Chat",
    };

    res.render("pages/create-group", {
      ...seo,
      layout: "layout/private",
    });
  })
  .post(checkAuthenticate, async (req, res) => {
    const { name } = req.body;

    const seo = {
      title: "Create Group / Realtime Chat",
    };

    const fields = {
      ...seo,
      layout: "layout/private",
      errors: [],
    };

    if (!name) fields.errors.push("Name Required");
    if (name?.length > 30) {
      fields.errors.push("Name must be less than 30 characters");
      fields.name = name;
    }

    const existingName = await prisma.room.findFirst({
      where: {
        name,
      },
    });
    if (existingName) {
      fields.errors.push("Name already taken");
      fields.name = name;
    }

    if (Boolean(fields.errors.length)) {
      res.render("pages/create-group", fields);
      return;
    }

    const createNewRoom = await prisma.room.create({
      data: {
        name,
        participants: {
          create: {
            userId: req.user.id,
            role: "Founder",
          },
        },
      },
    });

    if (createNewRoom) {
      fields.success_msg = "Group created successfully";
    } else {
      fields.errors.push("Oops something wen't wrong, please try again later.");
    }

    res.render("pages/create-group", fields);
  });

// Login -> /login
app
  .route("/login")
  .get(checkNotAuthenticate, (req, res) => {
    const seo = {
      title: "Login / Realtime Chat",
    };

    res.render("pages/login", {
      ...seo,
      layout: "layout/public",
    });
  })
  .post(
    checkNotAuthenticate,
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
      failureFlash: true,
    })
  );

// Register -> /register
app
  .route("/register")
  .get(checkNotAuthenticate, (req, res) => {
    const seo = {
      title: "Register / Realtime Chat",
    };

    res.render("pages/register", {
      ...seo,
      layout: "layout/public",
    });
  })
  .post(checkNotAuthenticate, async (req, res) => {
    const { name, username, email, password } = req.body;

    console.info(username);

    const seo = {
      title: "Register / Realtime Chat",
    };

    const fields = {
      layout: "layout/public",
      ...seo,
    };

    const errors = [];

    if (!name) errors.push("Name is required");
    if (name?.length > 30) errors.push("Name must be less than 30 characters");
    if (!username) errors.push("Username is required");
    if (username?.length > 30)
      errors.push("Username must be less than 30 characters");
    if (!email) errors.push("Email is required");
    if (email?.length > 100)
      errors.push("Email must be less than 100 characters");
    if (!password) errors.push("Password is required");

    const [existingUsername, existingEmail] = await Promise.all([
      await prisma.user.findFirst({
        where: {
          username,
        },
      }),
      await prisma.user.findFirst({
        where: {
          email,
        },
      }),
    ]);
    if (existingUsername) errors.push("Username already taken");
    if (existingEmail) errors.push("Email already taken");

    if (errors?.length) {
      fields.errors = errors;
      fields.name = name;
      fields.username = username;
      fields.email = email;
      fields.password = password;

      res.render("pages/register", fields);
      return;
    }

    const hashingPassword = await hash(password, 8);

    const newDataUser = {
      name,
      username,
      email,
      hashingPassword,
    };

    const resNewDataUser = await prisma.user.create({
      data: newDataUser,
    });

    if (resNewDataUser) fields.success_msg = "User created successfully";

    res.render("pages/register", fields);
  });

// Logout -> /logout
app.delete("/logout", checkAuthenticate, (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

io.on("connection", (socket) => {
  socket.on("message", async (data) => {
    const newMessage = await prisma.message.create({
      data,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    socket.broadcast.emit("message", {
      text: newMessage.text,
      username: newMessage.user.username,
      createdAt: newMessage.createdAt,
    });
  });
});

// Running Server
server.listen(process.env.PORT, () => {
  console.info(`Server running at http://localhost:${process.env.PORT}`);
});
