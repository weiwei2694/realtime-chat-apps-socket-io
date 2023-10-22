# Realtime Chat Apps | Using Socket IO

## What is Realtime Chat Apps?

My practice project for using [Socket IO](https://socket.io/docs/v4/tutorial/introduction)
This project explores the implementation of realtime chat applications, utilizing Socket.IO for instant messaging and updates. Realtime chat apps enable users to engage in text-based conversations with other users or within groups in a dynamic and immediate manner.

## Preview

![Home](https://github.com/weiwei2694/realtime-chat-apps-socket-io/blob/main/public/assets/preview-1.PNG)
![Room](https://github.com/weiwei2694/realtime-chat-apps-socket-io/blob/main/public/assets/preview-2.PNG)
![Search Menu](https://github.com/weiwei2694/realtime-chat-apps-socket-io/blob/main/public/assets/preview-3.PNG)

## Features

- Room/Group Chat
- Search Menu
- Join Room/Group
- Create Room/Group
- Roles (Founder, User, Admin)
- Authentication And Authorization
- Database using Mysql
- Orm using Prisma

## Cloning the repository

```bash
git clone https://github.com/weiwei2694/realtime-chat-apps-socket-io.git
cd realtime-chat
npm install
```

## Setup .env file

```bash
# SERVER
PORT=8000
# MYSQL
DATABASE_URL=""
# PASSPORT
SESSION_SECRET="secret key"
```

## Setup Prisma

```bash
npx prisma generate
npx prisma db push
```

## Start the app

```bash
npm run dev
```

## Available commands

To run these commands, use `npm run [command]`.

| Command      | Description                                                   |
| ------------ | ------------------------------------------------------------- |
| dev          | Run the application in development mode using Nodemon.        |
| prettier     | Check code formatting in your project using Prettier.         |
| prettier:fix | Check and fix code formatting in your project using Prettier. |
