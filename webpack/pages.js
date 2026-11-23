module.exports = [
 ['index','Главная','Свобода для твоего интернета.'],
 ['login','Войти','Welcome back to'],
 ['forgot-password','Forgot password','Forgot password'],
 ['create-account','Create account','Create account'],
 ['account','Кабинет','Твоё пространство.']
].map(([name,title,heading])=>({name,title,heading,template:'pages/'+name+'.hbs',modules:['src/modules/main.js'],styles:['src/styles/base.scss']}));
