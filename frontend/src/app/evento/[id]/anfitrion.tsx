import React,{useEffect,useState}from'react';
import{useLocalSearchParams}from'expo-router';
import{Aviso,Boton,Campo,Cargando,Pantalla,Secundario,Tarjeta,Titulo}from'../../../componentes/ui';
import{api}from'../../../servicios/api';
import type{Evento,Participante,Videojuego,Puesto,Partida}from'../../../tipos';
import{errorTexto,fecha,estado}from'../../../utilidades/formato';

export default function PanelAnfitrion(){
 const{id}=useLocalSearchParams<{id:string}>();
 const[evento,setEvento]=useState<Evento|null>(null);
 const[participantes,setParticipantes]=useState<Participante[]>([]);
 const[juegos,setJuegos]=useState<Videojuego[]>([]);
 const[puestos,setPuestos]=useState<Puesto[]>([]);const[partidas,setPartidas]=useState<Partida[]>([]);
 const[participante,setParticipante]=useState('');
 const[cantidad,setCantidad]=useState('1');
 const[nombreJuego,setNombreJuego]=useState('');
 const[plataforma,setPlataforma]=useState('');
 const[codigo,setCodigo]=useState('');
 const[compatibles,setCompatibles]=useState<string[]>([]);
 const[error,setError]=useState('');
 const[exito,setExito]=useState('');
 const[carga,setCarga]=useState(true);
 const[ocupado,setOcupado]=useState('');
 const cargar=async()=>{setError('');try{const[e,p,j,pu,pa]=await Promise.all([api.get<Evento>(`/eventos/${id}`),api.get<Participante[]>(`/eventos/${id}/participantes`),api.get<Videojuego[]>('/videojuegos'),api.get<Puesto[]>(`/eventos/${id}/puestos`),api.get<Partida[]>(`/eventos/${id}/partidas`)]);setEvento(e);setParticipantes(p);setJuegos(j);setPuestos(pu);setPartidas(pa)}catch(x){setError(errorTexto(x))}finally{setCarga(false)}};
 useEffect(()=>{void cargar()},[id]);
 const ejecutar=async(clave:string,fn:()=>Promise<unknown>,mensaje:string)=>{setOcupado(clave);setError('');setExito('');try{await fn();setExito(mensaje);await cargar()}catch(x){setError(errorTexto(x))}finally{setOcupado('')}};
 if(carga)return <Pantalla><Cargando/></Pantalla>;
 if(!evento)return <Pantalla><Aviso mensaje={error||'No se encontró la edición.'}/></Pantalla>;
 return <Pantalla><Titulo>Panel de anfitrión</Titulo><Tarjeta><Titulo pequeno>{estado(evento.estado)}</Titulo><Secundario>Inicio: {fecha(evento.fechaInicio)}</Secundario><Secundario>Cierre: {fecha(evento.fechaCierreEnfrentamientos)}</Secundario><Secundario>Premio: {evento.premio}</Secundario></Tarjeta>
 {error?<Aviso mensaje={error}/>:null}{exito?<Aviso mensaje={exito} ok/>:null}
 {evento.estado==='BORRADOR'?<Boton titulo="Iniciar edición" cargando={ocupado==='iniciar'} onPress={()=>void ejecutar('iniciar',()=>api.post(`/eventos/${id}/iniciar`),'Edición iniciada.')}/>:null}
 {evento.estado==='EN_CURSO'?<Boton titulo="Cerrar enfrentamientos" secundario cargando={ocupado==='cierre'} onPress={()=>void ejecutar('cierre',()=>api.post(`/eventos/${id}/cerrar-enfrentamientos`),'Enfrentamientos cerrados.')}/>:null}
 <Titulo pequeno>Emitir papeletas</Titulo><Tarjeta><Secundario>La emisión administrativa no descuenta monedas ni realiza conversiones.</Secundario>{participantes.map(p=><Boton key={p.id} titulo={p.usuario?.nombreVisible||p.usuarioId} secundario={participante!==p.id} onPress={()=>setParticipante(p.id)}/ >)}<Campo etiqueta="Cantidad (1 a 500)" value={cantidad} onChangeText={setCantidad} keyboardType="number-pad"/><Boton titulo="Emitir" cargando={ocupado==='emitir'} onPress={()=>{const n=Number(cantidad);if(!participante||!Number.isInteger(n)||n<1||n>500){setError('Selecciona un participante y una cantidad entre 1 y 500.');return}void ejecutar('emitir',()=>api.post(`/eventos/${id}/orla/emitir`,{participanteId:participante,cantidad:n}),'Papeletas emitidas.')}}/></Tarjeta>
 <Titulo pequeno>Videojuegos</Titulo><Tarjeta>{juegos.map(j=><Secundario key={j.id}>{j.nombre}{j.plataforma?` · ${j.plataforma}`:''}</Secundario>)}<Campo etiqueta="Nombre del videojuego" value={nombreJuego} onChangeText={setNombreJuego}/><Campo etiqueta="Plataforma (opcional)" value={plataforma} onChangeText={setPlataforma}/><Boton titulo="Añadir videojuego" secundario cargando={ocupado==='juego'} onPress={()=>{if(nombreJuego.trim().length<2){setError('El nombre debe tener al menos 2 caracteres.');return}void ejecutar('juego',()=>api.post('/videojuegos',{nombre:nombreJuego.trim(),plataforma:plataforma.trim()||undefined}),'Videojuego añadido.')}}/></Tarjeta>
 <Titulo pequeno>Puestos y compatibilidad</Titulo><Tarjeta>{puestos.map(p=><Secundario key={p.id}>{p.codigo}: {p.videojuegos?.map(j=>j.nombre).join(', ')}</Secundario>)}<Campo etiqueta="Código del puesto" value={codigo} onChangeText={setCodigo}/><Secundario>Selecciona los videojuegos compatibles:</Secundario>{juegos.map(j=><Boton key={j.id} titulo={j.nombre} secundario={!compatibles.includes(j.id)} onPress={()=>setCompatibles(actual=>actual.includes(j.id)?actual.filter(x=>x!==j.id):[...actual,j.id])}/ >)}<Boton titulo="Crear puesto" secundario cargando={ocupado==='puesto'} onPress={()=>{if(!codigo.trim()||!compatibles.length){setError('Indica un código y al menos un videojuego.');return}void ejecutar('puesto',()=>api.post(`/eventos/${id}/puestos`,{codigo:codigo.trim(),videojuegosIds:compatibles}),'Puesto creado.')}}/></Tarjeta>
 <Titulo pequeno>Finalizar partidas</Titulo><Tarjeta>{partidas.filter(p=>p.estado==='EN_CURSO').length===0?<Secundario>No hay partidas pendientes de resultado.</Secundario>:partidas.filter(p=>p.estado==='EN_CURSO').map(p=><View key={p.id} style={{gap:8}}><Secundario>Partida {p.id.slice(0,8)}</Secundario>{[p.participanteAId,p.participanteBId].map(pid=><Boton key={pid} titulo={"Ganador: "+(participantes.find(x=>x.id===pid)?.usuario?.nombreVisible||pid.slice(0,8))} secundario onPress={()=>void ejecutar("partida-"+p.id,()=>api.post(`/eventos/${id}/partidas/${p.id}/finalizar`,{ganadorId:pid}),"Resultado de partida registrado.")}/>)}</View>)}</Tarjeta><Titulo pequeno>Cierre de orla y sorteo</Titulo><Tarjeta><Secundario>El backend valida plazos, partidas activas, papeletas depositadas y unicidad del sorteo.</Secundario><Boton titulo="Cerrar orla" secundario deshabilitado={!!evento.orlaCerradaEn} cargando={ocupado==='orla'} onPress={()=>void ejecutar('orla',()=>api.post(`/eventos/${id}/orla/cerrar`),'Orla cerrada.')}/><Boton titulo="Realizar sorteo" deshabilitado={evento.estado==='FINALIZADO'} cargando={ocupado==='sorteo'} onPress={()=>void ejecutar('sorteo',()=>api.post(`/eventos/${id}/orla/sorteo`),'Sorteo realizado.')}/></Tarjeta>
 <Boton titulo="Actualizar panel" secundario onPress={()=>{setCarga(true);void cargar()}}/></Pantalla>
}