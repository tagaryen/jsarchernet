const addon = require('./build/Release/addon');

// 测试加法
// console.log('3 + 5 =', addon.add(3, 5));

// // 测试错误处理
// try {
//   console.log('调用无效参数:', addon.add(2));
// } catch (e) {
//   console.log('错误捕获:', e.message);
// }

// try {
//   console.log('调用非数字参数:', addon.add(2, 'a'));
// } catch (e) {
//   console.log('错误捕获:', e.message);
// }

addon.log(12345, 19283718923122, "nihao,帅哥", Buffer.from("nihao"), (num, str, buf) => {
    console.log(num);
    console.log(str);
    console.log(buf);
})


