const notFound = (err, req, res, next) => {

  console.log("giugiugiuoihoihoihoih")
  const error = new Error(`Not Found - ${req.originalUrl}`);
  console.log("jod999999999999999999999999")
  res.status(404);
  if (error) {
    console.log("dsiofiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")
    console.log(error)
    console.log(err);
    res.render('errorPage',{message:err});
  } else {
    // No error, so continue to the next middleware
    next();
  }
};


const errorHandler = (err, req, res, next) => {
  console.log("errorrriiiiiiiiiiiiiiiiiiiiiiiiiiiiiiirr")
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.log(err);
  res.status(statusCode).json({
    message: err.message,
    stack: err.stack,
  });
  next(err);  // Pass the 'err' object to the next error handling middleware
}  
export {notFound,errorHandler}