function errorHandler(err, req, res, next) { // to handle errors
  if (err.name === 'UnauthorizedError') {
    res.status(err.status || 401).send({
      message:"the user is not Authorize ",
    });
  }

  if(err.name === 'ValidationError'){
    res.status(err.status || 400).send({
        message:err.message
        });
}
return res.status(500).json(err)
}
module.exports = errorHandler; // to export the error handler