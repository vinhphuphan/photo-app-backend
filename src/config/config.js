export const responseData = (res, message, code, data) => {
    res.status(code).json({
        message,
        code,
        data,
        date : new Date()
    })
}

