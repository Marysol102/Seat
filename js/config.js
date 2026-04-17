// ── Constantes globales ──────────────────────────────────────
const N       = 5;
const SHAPES  = ['circle','square','triangle','x','diamond'];
const COLORS  = ['red','blue','green','yellow','white'];
const C_HEX   = {red:'#E05252',blue:'#4D6FD1',green:'#4EA84E',yellow:'#D4AE2C',white:'#E8E8E8'};
// Prioridad de backtracking: más restringido primero
// 5×5 → cuadrado(4) < x(9) < triángulo(12) < rombo(13) < círculo(25)
const SPRIO   = {square:0, x:1, triangle:2, diamond:3, circle:4};
