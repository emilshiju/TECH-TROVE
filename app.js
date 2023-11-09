import express from "express";
import { fileURLToPath } from 'node:url'
import {join,dirname} from 'path';
import morgan from "morgan"
import hbs from "express-handlebars"
import {notFound,errorHandler} from './middlewares/errorMiddleWare.js'
import users from "./models/user.js"
import nocache from "nocache";
import helpers from "./helpers/handlebarHelpers.js"
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash"
const app=express()


app.use(flash())
app.use(nocache())

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__filename)
const hbsinstance=hbs.create({
    extname:'hbs',
    defaultLayout:'layout',
    layoutDir:join(__dirname,'views'),
    partialsDir:join(__dirname,'views/partials'),
	helpers:helpers,
    runtimeOptions: { allowProtoPropertiesByDefault: true, allowedProtoMethodsByDefault: true }
})



app.use(cookieParser())

app.use(
	session({
		secret: 'ABCDE',
		resave: true,
		saveUninitialized: true,
		cookie: {
			maxAge: 24 * 60 * 60 * 1000 * 7, // Set session timeout to 1 day (in milliseconds)
		  }
	})
)



app.use(express.json())
app.use(express.urlencoded({extended:true}))


app.use(express.static(join(__dirname,'public')))

app.use('/admin/assets',express.static(join(__dirname,'/public/admin/assets')))
//   for user aaests file
app.use('/assets',express.static(join(__dirname,'/public/user/assets')))


app.engine('hbs',hbsinstance.engine)
app.set('view engine','hbs')
app.set('views',join(__dirname,'views'))



// Route import
import user from './routes/userRoute.js'
import admin from './routes/adminRoute.js'
import product from './routes/productRoute.js'
import category from  './routes/categoryRoute.js'
import promotion from "./routes/promotionsRoute.js";
import cart from "./routes/cartRoute.js"
import oder from "./routes/oderRoute.js"
import coupon from "./routes/couponRoute.js"


app.use('/', user)
app.use('/',admin)
app.use('/',product)
app.use('/',category)
app.use('/',promotion)
app.use('/',cart)
app.use('/',oder)
app.use('/',coupon)
app.get('*',(req,res)=>{
	res.render('errorPage')
})




app.use(
	morgan((tokens, req, res) => {
		const status = tokens.status(req, res)
		const statusColor = Number(status) >= 400 ? '\x1b[31m' : '\x1b[32m'
		if (Number(status) !== 304) {
			return `${statusColor}${tokens.method(req, res)} ${tokens.url(req, res)} - ${tokens.status(
				req,
				res
			)} ${tokens.res(req, res, 'content-length')} - ${tokens['response-time'](req, res)} ms\x1b[0m`
		}
		return null
	})
)

app.use(notFound)
app.use(errorHandler)

// In app.js
export default app;
