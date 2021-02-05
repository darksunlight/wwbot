module.exports = x => {
    let loggerDate = new Date();
    console.log('[' + loggerDate.toISOString() + '] ' + x);
}