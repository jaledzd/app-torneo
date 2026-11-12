import {Platform} from 'react-native';
import * as SecureStore from 'expo-secure-store';
const TOKEN='apuchitorneo_token',USUARIO='apuchitorneo_usuario';
async function leer(k:string){return Platform.OS==='web'?(typeof localStorage==='undefined'?null:localStorage.getItem(k)):SecureStore.getItemAsync(k)}
async function escribir(k:string,v:string){if(Platform.OS==='web'){if(typeof localStorage!=='undefined')localStorage.setItem(k,v)}else await SecureStore.setItemAsync(k,v)}
async function borrar(k:string){if(Platform.OS==='web'){if(typeof localStorage!=='undefined')localStorage.removeItem(k)}else await SecureStore.deleteItemAsync(k)}
export const almacenamiento={obtenerToken:()=>leer(TOKEN),async obtenerUsuario<T>():Promise<T|null>{const v=await leer(USUARIO);if(!v)return null;try{return JSON.parse(v) as T}catch{await borrar(USUARIO);return null}},async guardar(token:string,usuario:unknown){await escribir(TOKEN,token);await escribir(USUARIO,JSON.stringify(usuario))},async limpiar(){await Promise.all([borrar(TOKEN),borrar(USUARIO)])}};