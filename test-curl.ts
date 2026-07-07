import jwt from "jsonwebtoken";
const token = jwt.sign({ uid: "c99b1d68-bbf8-48e3-a9da-367927d65c6c", email: "admin@auraepm.com" }, "secret-value-2026");
console.log(token);
