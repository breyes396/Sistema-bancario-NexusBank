import multer from 'multer';

const fileFilter = (req, file, cb) => {
	const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	if (allowedMimes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'), false);
	}
};

export const uploadProfilePhoto = multer({
	storage: multer.memoryStorage(),
	fileFilter,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB sin limitación práctica
	},
});
