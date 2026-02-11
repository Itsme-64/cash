export function errorHandler(err, req, res, next) {
    const status = err.status || 500
    const errData = {};

    // Development
    console.error(err);

    switch(status) {
        case 400: {
            errData.message = 'Your browser sent a request this server could not understand'
            errData.redirect = 'previous'
            break;
        } 
        case 401: {
            errData.message = 'Authentication required!'
            errData.redirect = 'previous'
            break;
        }
        case 402: {
            errData.message = 'A payment is required to proceed'
            errData.redirect = 'previous'
            break;
        }
        case 403: {
            errData.message = 'You do not have permission to access this page'
            errData.redirect = 'previous'
            break;
        }
        case 404: {
            errData.message = "The page you're looking for was not found"
            errData.redirect = 'previous'
            break;
        }
        case 405: {
            errData.message = "Method not allowed"
            errData.redirect = 'previous'
            break;
        }
        case 406: {
            errData.message = "Content not acceptable!"
            errData.redirect = 'previous'
            break;
        }
        case 408: {
            errData.message = "Request timeout!"
            errData.redirect = 'previous'
            break;
        }
        case 409: {
            errData.message = "Resource conflict!"
            errData.redirect = 'previous'
            break;
        }
        case 410: {
            errData.message = "Resource no longer available!"
            errData.redirect = 'previous'
            break;
        }
        case 413: {
            errData.message = 'File too large!'
            errData.redirect = 'previous'
            break;
        }
        case 414: {
            errData.message = "URL too long!"
            errData.redirect = 'previous'
            break;
        }
        case 415: {
            errData.message = "Unsupported file type!"
            errData.redirect = 'previous'
            break;
        }
        case 418: { 
            errData.message = "I'm a teapot!"
            errData.redirect = 'previous'
            break;
        }
        case 422: {
            errData.message = "Unprocessable request!"
            errData.redirect = 'previous'
            break;
        }
        case 429: {
            errData.message = "Too many requests!"
            errData.redirect = 'previous'
            break;
        }
        case 431: {
            errData.message = "Request header fields too large!"
            errData.redirect = 'previous'
            break;
        }
        case 451: {
            errData.message = "Unavailable for legal reasons!"
            errData.redirect = 'home'
            break;
        }
        case 500: { 
            errData.message = 'Internal server error!'
            errData.redirect = 'home'
            break;
        }
        case 501: { 
            errData.message = 'Feature not implemented!'
            errData.redirect = 'previous'
            break;
        }
        case 502: { 
            errData.message = 'Bad gateway!'
            errData.redirect = 'home'
            break;
        }
        case 503: { 
            errData.message = 'Service unavailable!'
            errData.redirect = 'home'
            break;
        }
        case 504: { 
            errData.message = 'Gateway timeout!'
            errData.redirect = 'home'
            break;
        }
        case 508: { 
            errData.message = 'Infinite loop detected!'
            errData.redirect = 'home'
            break;
        }
        case 1984: { 
            errData.message = 'Literally 1984...'
            errData.redirect = 'previous'
            break;
        }
    }

    res.status(status).render('user/error', { number: status, redirect: errData.redirect, message: errData.message });
}

export function notFound(req, res) {
    const message = "The page you're looking for was not found."
    res.status(404).render('user/error', { number: 404, redirect: 'previous', message })
}