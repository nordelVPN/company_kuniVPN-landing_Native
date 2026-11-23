const path=require('node:path');const common=require('./webpack.common');
module.exports={...common,mode:'development',devtool:'source-map',output:{...common.output,path:path.resolve(__dirname,'../build/dev')},devServer:{port:3000,hot:true,client:{overlay:true},setupMiddlewares(middlewares,server){
 server.compiler.hooks.done.tap('TemplateReload',()=>{
  const files=[...(server.compiler.modifiedFiles||[])].map(file=>file.split(path.sep).join('/'));
  if(files.some(file=>file.endsWith('.hbs')||file.endsWith('/pages')||file.includes('/src/templates')||file.includes('/src/data')))setImmediate(()=>server.getHotMiddleware()?.publish({action:'reload'}));
 });return middlewares;
}},plugins:[...common.plugins,{apply(compiler){compiler.hooks.thisCompilation.tap('Templates',compilation=>{for(const dir of ['pages','src/templates','src/data'])compilation.contextDependencies.add(path.resolve(__dirname,'..',dir));});}}]};
