import multer from "multer";

const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|webp|jpeg)$/)) {
      return cb(Error("Please upload a picture."));
    }
    return cb(undefined, true);
  },
});

export default upload;
