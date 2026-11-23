const data = {
 nav:[{href:'features',label:'Возможности'},{href:'apps',label:'Приложения'},{href:'security',label:'Безопасность'},{href:'support',label:'Поддержка'}],
 platforms:[
 {id:'windows',name:'Windows',description:'Desktop application',icon:'os-windows.png',image:'windows-device.webp',width:260,height:157,versions:[]},
 {id:'macos',name:'macOS',description:'For your Mac',icon:'os-macos.png',image:'macos-device.webp',width:260,height:157,versions:[]},
 {id:'ios',store:'App Store',name:'iOS',description:'For iPhone and iPad',icon:'os-ios.png',image:'ios-device.webp',width:165,height:165,versions:[]},
 {id:'android',store:'Google Play',name:'Android',description:'For your Android phone',icon:'os-android.png',image:'android-device.webp',width:165,height:172,versions:[]},
 {id:'linux',name:'Linux',description:'For your Linux computer',icon:'os-linux.png',image:'linux-device.webp',width:260,height:157,versions:[]}
 ],
 plans:[
 {id:'trial',name:'Триал — 1 месяц',period:'1 месяц',price:1,devices:5,condition:'Один раз для нового пользователя. Платный триал.'},
 {id:'monthly',name:'1 месяц',period:'1 месяц',price:7,devices:5},
 {id:'quarterly',name:'3 месяца',period:'3 месяца',price:15,devices:5,monthlyEquivalent:'5'},
 {id:'yearly',name:'12 месяцев',period:'12 месяцев',price:55,devices:5,monthlyEquivalent:'4.58'}
 ]
};
// A single explicit fixture, separate from real server-owned subscription data.
data.sampleSubscription={planId:'yearly'};
data.subscriptionPlan=data.plans.find(plan=>plan.id===data.sampleSubscription.planId);
module.exports=data;
