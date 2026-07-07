import { fail, ok } from "../utils/response.js";

export async function uploadFile(req, res) {
  if (!req.file) {
    return fail(res, "Upload requires a file", 400);
  }

  return ok(res, {
    filename: req.file.originalname,
    status: "uploaded"
  }, 201);
}
