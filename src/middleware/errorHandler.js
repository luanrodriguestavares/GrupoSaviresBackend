exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        message: 'Um erro inesperado ocorreu',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
};

