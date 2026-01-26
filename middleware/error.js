export function errorHandler(err, req, res, next) {
    const status = err.status || 500
    const errData = {};

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
        case 413: {
            errData.message = 'File too large!'
            errData.redirect = 'previous'
            break;
        }
        case 418: { 
            errData.message = "I'm a teapot!"
            errData.redirect = 'previous'
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
        case 504: { 
            errData.message = 'Gateway timeout!'
            errData.redirect = 'home'
            break;
        }
    }

    res.status(status).render('user/error', { number: status, redirect: errData.redirect, message: errData.message });
}

export function notFound(req, res) {
    const message = "The page you're looking for was not found."
    res.status(404).render('user/error', { number: 404, redirect: 'previous', message })
}

// router.use((req, res) => {
//     const message = "Method not allowed!";
//     res.status(405).render('user/error', { number: 405, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Content not acceptable!";
//     res.status(406).render('user/error', { number: 406, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Request timeout!";
//     res.status(408).render('user/error', { number: 408, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Resource conflict!";
//     res.status(409).render('user/error', { number: 409, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Resource no longer available!";
//     res.status(410).render('user/error', { number: 410, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "URL too long!";
//     res.status(414).render('user/error', { number: 414, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Unsupported file type!";
//     res.status(415).render('user/error', { number: 415, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Unprocessable request!";
//     res.status(422).render('user/error', { number: 422, redirect: "previous", message })
// });

// router.use((req, res) => {
//     const message = "Too many requests!";
//     res.status(429).render('user/error', { number: 429, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Service unavailable!";
//     res.status(503).render('user/error', { number: 503, redirect: "home", message })
// });

// router.use((req, res) => {
//     const message = "Infinite loop detected!";
//     res.status(508).render('user/error', { number: 508, redirect: "home", message })
// });