<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Table of Contents

1. [General Info](#general-info)
2. [Technologies](#technologies)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Docker Stack](#docker-stack)
8. [Test](#test)
9. [API Documentation](#api-documentation)
10. [Contact & Follow](#contact-&-follow)

### General Info

***
**Projects Management API**

The **Projects Management API** is a robust microservice designed to handle the **administration and management of
projects**, including the **management of project members** and their **associated tasks**. It forms part of a modular
architecture that promotes scalability and separation of concerns within larger systems.

This service provides endpoints for:

- Creating, updating, and deleting projects.
- Managing project members and their roles.
- Organizing and tracking tasks linked to specific projects.
- Supporting authorization and permission control at the project level.

It is developed using **NestJS**, **MongoDB**, and follows best practices for **RESTful API design**.

### Technologies

***
A list of technologies used within the project:

- **[@nestjs/common] (v11.0.1):** Provides fundamental building blocks for modules, controllers, services, and
  dependency injection in NestJS.

- **[@nestjs/core] (v11.0.1):** The core NestJS framework engine, handling application lifecycle and dependency
  management.

- **[@nestjs/config] (v4.0.2):** Enables typed and schema-based configuration management using `.env` files and
  integration with `joi`.

- **[@nestjs/swagger] (v11.2.0):** Simplifies the creation of interactive API documentation and allows OpenAPI
  specification generation.

- **[@nestjs/mongoose] (v11.0.3) & [mongoose] (v8.16.4):** Provides seamless integration with MongoDB through
  schema-based modeling and decorators.

- **[@nestjs/jwt] (v11.0.0) & [passport-jwt] (v4.0.1):** Enables secure authentication via JSON Web Tokens, essential
  for role-based access control.

- **[@nestjs/passport] (v11.0.5):** Adapts the Passport.js authentication middleware into the NestJS ecosystem.

- **[class-validator] (v0.14.2) & [class-transformer] (v0.5.1):** Used for request DTO validation and transformation,
  ensuring data integrity and safety.

- **[bcrypt] (v6.0.0):** Handles password hashing and verification, essential for user authentication.

- **[joi] (v17.13.3):** Used for configuration schema validation, ensuring environment variables meet defined
  constraints.

- **[jest] (v29.7.0), [ts-jest] (v29.2.5), and [supertest] (v7.0.0):** A testing stack for unit and end-to-end tests to
  ensure code reliability and correctness.

- **[eslint], [prettier], and [typescript-eslint]:** Enforces code style, linting rules, and consistent TypeScript
  development practices.

- **[@swc/core] & [@swc/cli]:** Used for ultra-fast transpilation and test performance, as an alternative to the
  traditional TypeScript compiler in testing environments.

### Prerequisites

***
Before you begin, ensure you have met the following requirements:

* You have installed node.js(**version 20+**) and npm.
* You have MongoDB.
* Docker and Docker Compose installed(if you prefer to run the application with Docker)

## Installation

To install API, follow these steps:

```bash
$ git clone https://github.com/jmarqb/project-management-system-API.git
$ cd project-management-system-API
$ npm install
```

## Configuration

* Copy the contents of env-example into a new .env file and update it with your Credentials for connection parameters or
  use the values in the env-example.
* Remember, you must have a running instance of MongoDB (https://www.mongodb.com/try/download/community)

## Running the Application

To run Manager Notification API, use the following command:

```bash
$ npm run build
$ npm run start
```

This will start the server and the application will be available at http://localhost:<your_port>

For Example: `http://localhost:3000/api`

We recommend you visit the section [API Documentation](#api-documentation)

## Docker Stack

If you have Docker and Docker Compose installed, running the application becomes even easier. First, clone the
repository and navigate to the project directory:

```bash
$ git clone https://github.com/jmarqb/project-management-system-API.git
$ cd project-management-system-API
$ npm install
```

**Important**

The docker-compose.yml file defines hardcoded environment variables for the application:

``` 
environment:
  - PORT=3000
  - JWT_SECRET=your_secret_json_web_token
  - DATABASE_URL=mongodb://mongo:27017/projects_management_system_database
```

If you want to modify any of these variables, you must do it directly in the docker-compose.yml file before building the
services.

* Now, you can start the services by running:

```
docker-compose up --build
```

This will start the server and the application will be available at http://localhost:<your_port>

For Example: `http://localhost:3000/api`

## Test

To ensure everything runs smoothly, this project includes both Unit and Integration tests using the tools Jest and
Supertest. To execute them, follow these steps:

Dependency Installation: Before running the tests, ensure you've installed all the project dependencies. If you haven't
done so yet, you can install them by executing the command `npm install`.

Unit Tests: To run unit tests on controllers and services, use the following command:

```bash
$ npm run test
```

## API Documentation

For more detailed information about the workflow of the API , endpoints, responses and status codes, visit the API
documentation.

You can access the API documentation at `localhost:<port>/api`
For example, when running the server locally, it will be available at localhost:3000/api

---

## Contact & Follow

Thank you for checking out my project! If you have any questions, feedback or just want to connect, here's where you can
find me:

**GitHub**: [jmarqb](https://github.com/jmarqb)

Feel free to [open an issue](https://github.com/jmarqb/project-management-system-API/issues) or submit a PR if you find
any
bugs or have some suggestions for improvements.

© 2025 Jacmel Márquez. All rights reserved.






