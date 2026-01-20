import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Register Convex Auth HTTP routes for OAuth callbacks
auth.addHttpRoutes(http);

export default http;
