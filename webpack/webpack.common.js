const path = require('node:path');
const fs = require('node:fs');
const Handlebars = require('handlebars');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pages = require('./pages');
const root = path.resolve(__dirname,'..');
function render(page) {
  const dataPath = require.resolve('../src/data/pages');
  delete require.cache[dataPath];
  const data = require(dataPath);
  const localePath = require.resolve('../src/data/locales.json');
  delete require.cache[localePath];
  const english = require(localePath).en;
  Handlebars.registerHelper('asset', name => './assets/images/'+name);
  Handlebars.registerHelper('t', key => {
    if (Object.prototype.hasOwnProperty.call(english,key)) return english[key];
    if (/[А-Яа-яЁё]/.test(key)) throw Error('Missing English translation: '+key);
    return key;
  });
  const partialDir = path.join(root,'src/templates/partials');
  for (const file of fs.readdirSync(partialDir)) Handlebars.registerPartial(path.basename(file,'.hbs'),fs.readFileSync(path.join(partialDir,file),'utf8'));
  const context = {...data, ...page, pageFlags:{[page.name]:true}, titleKey:page.title+' · kuniVPN', descriptionKey:page.title+' kuniVPN — приложения, помощь и информация о проекте.'};
  const body = Handlebars.compile(fs.readFileSync(path.join(root,page.template),'utf8'))(context);
  return Handlebars.compile(fs.readFileSync(path.join(root,'src/templates/layouts/main.hbs'),'utf8'))({...context,body});
}
module.exports = {
 context:root,
 entry:Object.fromEntries(pages.map(p=>[p.name,[...p.modules,...p.styles].map(f=>path.join(root,f))])),
 output:{path:path.join(root,'build/prod'),filename:'assets/[name].[contenthash:8].js',publicPath:'./',clean:true},
 module:{rules:[{test:/\.scss$/,use:[{loader:MiniCssExtractPlugin.loader,options:{publicPath:'../'}},'css-loader','postcss-loader','sass-loader']},{test:/\.(png|webp|svg|woff2)$/i,type:'asset/resource',generator:{filename:'assets/[name].[contenthash:8][ext]'}}]},
 plugins:[{apply(compiler){compiler.hooks.thisCompilation.tap('Assets',compilation=>{compilation.hooks.processAssets.tap({name:'Assets',stage:compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL},()=>{const dir=path.join(root,'src/assets/images');for(const file of fs.readdirSync(dir))compilation.emitAsset('assets/images/'+file,new compiler.webpack.sources.RawSource(fs.readFileSync(path.join(dir,file))));});});}},new MiniCssExtractPlugin({filename:'assets/[name].[contenthash:8].css'}),...pages.map(p=>new HtmlWebpackPlugin({filename:p.name+'.html',chunks:[p.name],templateContent:()=>render(p)}))]
};