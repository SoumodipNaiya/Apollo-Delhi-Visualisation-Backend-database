const propertymapper = (obj, prop) => {
    if(typeof prop === 'function') return prop(obj);
    let s = "obj."+prop;
    return eval(s);
}
module.exports = propertymapper;