import multer from 'multer';
import path from 'path';

// Multer configuration for file uploads
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, Word documents, Excel files, and common assignment file types
  const allowedFileTypes = [
    '.jpg', '.jpeg', '.png', '.gif',  // Images
    '.pdf', '.doc', '.docx',          // Documents
    '.xls', '.xlsx',                  // Excel
    '.ppt', '.pptx',                  // PowerPoint
    '.zip', '.rar',                   // Archives
    '.txt', '.csv'                    // Text files
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedFileTypes.includes(ext)) {
    return cb(
      new Error('File type not supported. Supported file types: ' + allowedFileTypes.join(', ')), 
      false
    );
  }
  cb(null, true);
};

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/tmp/');  // Store files temporarily before uploading to Cloudinary
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instances
export const uploadSingle = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
}).single('file'); // 'file' is the field name for the uploaded file

export const uploadAssignment = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB file size limit for assignments
  }
}).single('assignment');

export const uploadAvatar = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
      return cb(new Error('Only JPG, JPEG and PNG images are allowed for avatars'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit for avatars
  }
}).single('avatar');

export const uploadCSV = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return cb(new Error('Only CSV files are allowed for imports'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
}).single('csv');

