const { compare } = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;
const prisma = require("../prisma");

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
      });

      if (!user) {
        return done(null, false, { message: "email incorrect" });
      }
      if (await compare(password, user.hashingPassword)) {
        return done(null, user);
      }

      return done(null, false, { message: "password incorrect" });
    } catch (error) {
      done(error);
    }
  },
);

const serializeUser = (user, done) => {
  process.nextTick(function () {
    return done(null, user.id);
  });
};

const deserializeUser = (id, done) => {
  process.nextTick(async function () {
    try {
      const existingUser = await prisma.user.findFirst({
        where: { id },
      });

      done(null, existingUser);
    } catch (error) {
      done(error);
    }
  });
};

module.exports = {
  localStrategy,
  serializeUser,
  deserializeUser,
};
