const multer = require('multer');

// const upload = multer({ storage,fileFilter });
const upload = multer({dest: "uploads/" });



module.exports = upload;