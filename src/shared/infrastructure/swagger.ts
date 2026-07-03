import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AuraPM Enterprise API",
      version: "1.0.0",
      description: "Comprehensive Project Management Platform API",
    },
    servers: [
      {
        url: "/api/v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/interface/*.router.ts", "./src/interface/*.router.ts"],
};

export const specs = swaggerJsdoc(options);
