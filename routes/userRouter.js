const express = require('express');
const User = require('../models/Student');
const multer = require('multer');
const multerMiddleware = require('./multerMiddleware');
const sharpMiddleware = require('./sharpMiddleware');

const fs = require('fs');

const userValidationSchema = require('./validations/studentValidationSchema');

const userRouter = express.Router();

// Setup multer to receive images in userRouter.post
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './uploads');
	},

	filename: (req, file, cb) => {
		// console.log("From multer")
		// console.log(file)

		cb(
			null,
			req.body.firstName +
				req.body.lastName +
				new Date().toISOString() +
				'.' +
				file.mimetype.split('/')[1]
		);
	},
});

userRouter.post(
	'/addstudent',
	multerMiddleware,
	sharpMiddleware,
	// First Callback: Multer Middleware
	// multerErrorHandler,

	// Second Callback: Express middleware
	async (req, res) => {
		// console.log(res.locals);
		const cardPhotos = res.locals.cardPhotos;

		try {
			const { error, value } = userValidationSchema.validate({
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				studyNumber: req.body.studyNumber,
				school: req.body.school,
				phone: req.body.phone,
				phoneOperator: req.body.phoneOperator,
				city: req.body.city,

				cardPhotos: cardPhotos,
			});
			if (error) {
				return res.status(400).json({
					origin: 'Joi/validate',
					message: error.details[0].message,
				});
			}
		} catch (error) {
			console.log('Validation Error');
			console.log(error);
		}

		try {
			const userExist = await User.findOne({
				studyNumber: req.body.studyNumber,
			});

			// if (userExist) {
			// 	return res.status(409).json({
			// 		message: 'The information you entered already exists',
			// 	});
			// }
			const phoneExist = await User.findOne({
				phone: req.body.phone,
			});

			// if (phoneExist) {
			// 	return res.status(409).json({
			// 		message: 'The information you entered already exists',
			// 	});
			// }
		} catch (error) {
			console.log('Error while checking if user already exists');
		}
		try {
			const user = new User({
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				studyNumber: req.body.studyNumber,
				school: req.body.school,
				phone: req.body.phone,
				phoneOperator: req.body.phoneOperator,
				city: req.body.city,
				cardPhotos: cardPhotos,
				//
			});
			// TODO: delete file from uploads folder.
			console.log('Reached account creation in DB');
			const savedUser = await user.save();
			return res.status(200).json(savedUser);
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				origin: 'Student creation and saving in DB',
				error: error.message,
			});
		}
	}
);

module.exports = userRouter;
