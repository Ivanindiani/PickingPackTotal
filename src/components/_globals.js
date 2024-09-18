export function Sumar(n1, n2) {
    let r = n1+n2;
    return r.toString().split('.')[1]?.length > 14 ? parseFloat(r.toFixed(14)):r;
}
export function Restar(n1, n2) {
    let r = n1-n2;
    return r.toString().split('.')[1]?.length > 14 ? parseFloat(r.toFixed(14)):r;
}
export function Multiplicar(n1, n2) {
    let r = n1*n2;
    return r.toString().split('.')[1]?.length > 14 ? parseFloat(r.toFixed(14)):r;
}
export function Dividir(n1, n2) {
    let r = n1/n2;
    return r.toString().split('.')[1]?.length > 14 ? parseFloat(r.toFixed(14)):r;
}
