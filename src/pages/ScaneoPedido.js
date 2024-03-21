import { ActivityIndicator, Box, Pressable, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, LogBox, RefreshControl, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import KeyEvent from 'react-native-keyevent';
import RNBeep from "react-native-a-beep";

/* Librerias de IVAN */
import fetchIvan from "../components/_fetch";
import ListaPerform from "../components/_virtualList";
import SelectInput from "../components/_virtualSelect";
import ImagesAsync from "../components/_imagesAsync";
/* Librerias de IVAN */

/* IMPORT ICONS */
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
/* IMPORT ICONS */

const Global = require('../../app.json');

var sesionTimout = null;

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);

const ScaneoPedido = (props) => {
    const [traslado, setTraslado] = useState(props.route.params.traslado);
    const IDPAL = props.route.params.IDPAL;

    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [showInfo, setShowInfo] = useState('');
    const [cronometro, setCronometro] = useState({});
    const [openSheet, setOpenSheet] = useState(false);
    const [comentario, setComentario] = useState(-2);

    /** CONFIG **/
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [autosumar, setAutoSumar] = useState(true);
    const [autoinsert, setAutoInsert] = useState(true);
    /** CONFIG **/
    
    const [trasladoItems, setTrasladoItems] = useState([]);
    const pedido = props.pedido;

    const [scanCurrent, setScanCurrent] = useState({});
    const [rackSel, setRackSel] = useState(null);

    /** Referencias a componentes **/
    const mounted = useRef(null);
    const scrollPrincipal = useRef(null);
    const inputScan = useRef(null); // Input principal
    const inputCant1 = useRef(null); // Input cantidad escaneo
    const inputCantList = useRef(null); // Input cantidad escaneo
    const inputComentario = useRef(null); // Input comentario dialog
    /** Referencias a componentes **/

    /* EVENTO KEYBOARD */
    const evento = (keyEvent) => { 
        try {
            if(!inputScan.current?.isFocused() && !inputCantList.current?.isFocused() && !inputCant1.current?.isFocused() && !inputComentario.current?.isFocused()) {
                console.log(`Key: ${keyEvent.pressedKey}`);
                console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
                if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                    console.log("Activamos ")
                    inputScan.current?.focus();
                    scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                }

                if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                    }
                } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                    if(inputScan.current) {
                        inputScan.current.focus();
                        inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                        scrollPrincipal.current?.scrollTo({y: 20, animated: true});
                    }
                }
            }
        } catch(e) {
            console.log(e);
        }
    }


    /* Efecto montura componente */
    useEffect(() => {
        mounted.current = true;
        getSesionScan();
        getTrasladoItems();
        
        if(traslado.TRSTS === 1) {
            KeyEvent.onKeyDownListener(evento);

            return () => {
                mounted.current = false;
                if(sesionTimout) {
                    clearTimeout(sesionTimout);
                }
                KeyEvent.removeKeyDownListener();
            }
        }

        return () => {
            mounted.current = false;
            if(sesionTimout) {
                clearTimeout(sesionTimout);
            }
        }
    }, []);
    /* Efecto montura componente */

    /* Efecto al seleccionar ubicacion reiniciamos cantidad */
    useEffect(() => {
        if(rackSel !== null && scanCurrent.MATNR && !scanCurrent.force){
            let existe = trasladoItems.filter(f => (scanCurrent.force && f.IDTRI === scanCurrent.IDTRI) || (!scanCurrent.force && f.MATNR === scanCurrent.MATNR 
                && f.CHARG === scanCurrent.CHARG && scanCurrent.ubicaciones[rackSel].UBI == f.IDADW && props.dataUser.IDUSR === f.UCRID && IDPAL === f.IDPAL));
            setScanCurrent({...scanCurrent, TCANT: existe.length ? existe[0].TCANT:0});
        }
    }, [rackSel]);

    /* Efecto al realizar llamado a la API reiniciamos el msj de error */
    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true]);

    /* Funciones fetch init() */
    function getSesionScan() {
        const datos = [
            `IDTRA=${traslado.IDTRA}`,
            `IDPAL=${IDPAL}`
        ];
        fetchIvan(props.ipSelect).get('/sesionScan', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
        .then(({data}) => {
            setCronometro({
                ...data.data,
                loaded: true
            });
        })
        .catch(({status, error}) => {
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
            if(mounted.current)
                sesionTimout = setTimeout(() => getSesionScan(), 3000); // Retry for 3 seconds
        })
    }

    const iniciarEscaneo = () => {
        const datos = {
            IDTRA: traslado.IDTRA,
            IDPAL: props.route.params.IDPAL
        };

        setLoading(true);
        fetchIvan(props.ipSelect).post('/sesionScan', datos, props.token.token, undefined, undefined, 60000) // 1 minuto para probar
        .then(({data}) => {
            console.log(data.data);
            setCronometro({
                ...data.data,
                loaded: true
            });
        })
        .catch(({status, error}) => {
            //console.log(error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        })
    }

    function getTrasladoItems(forceCheck = false, show = true) { // El force check es para avisar al usuario si hay productos con stock sobre pasados
        let datos = [
            `find={"IDTRA": ${traslado.IDTRA}}`,
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            //`IDPAL=${IDPAL}`,
            `checkProducts=${traslado.TRSTS === 1}`,
            `simpleData=true`
        ];
        
        setLoading(true);
        return new Promise((resolve) => {
            fetchIvan(props.ipSelect).get('/crudTrasladoItems', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
            .then(({data}) => {
                if(traslado.TRSTS == 1) {
                    for(let producto of data.data) {
                        try {
                            if(producto.CHARG) { // CON LOTES
                                producto.maxQuantityLote = {};
                                for(let lote of producto.Producto.ProdConLote) {
                                    producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS)-parseInt(lote.RESERVADOS ?? 0);
                                }
                            } else {
                                producto.maxQuantity = parseInt(producto.Producto.ProdSinLotes[0]?.LABST ?? 0)-parseInt(producto.Producto.ProdSinLotes[0]?.RESERVADOS ?? 0);
                            }
                            producto.unidad_index = producto.Producto.UnidadBase;
                            producto.noBase = false;
                            
                            if(forceCheck) {
                                if(producto.CHARG) {//Lote
                                    
                                    if(producto.TCANT > producto.maxQuantityLote[producto.CHARG]) {
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea la lista.");
                                        return resolve(false)
                                    }
                                } else {
                                    if(producto.TCANT > producto.maxQuantity) {
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea la lista.");
                                        return resolve(false)
                                    }
                                }
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
                resolve(data.data);
                setTrasladoItems(data.data);
                if(show)
                    ToastAndroid.show("Productos actualizados correctamente", ToastAndroid.SHORT)
            })
            .catch(({status, error}) => {
                //console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
                resolve(false);
            })
            .finally(() => {
                setLoading(false);
            });
        })
    }
    /* Funciones fetch */

    /* Funciones Scan */
    const findCode = (text) => {
        let scancode = text?.split(',')[0]?.match(/([A-Z|a-z|0-9])/g) ?? null;
        scancode = scancode?.join('') ?? null;
        console.log(scancode);
        if(!scancode) return;

        inputScan.current?.clear(); // Limpiamos el input
        inputScan.current?.focus(); // Limpiamos el input
        
        if(scanCurrent && scancode === scanCurrent.unidad_index?.EAN11) { // Si el escaneado es el mismo 
            if(autosumar && rackSel !== null) {
                let producto = JSON.parse(JSON.stringify(scanCurrent));
                let maximoPosible = 0;
                if(!producto.maxQuantityLote) {
                    maximoPosible = producto.noBase && producto.max_paquete == 0 ? 
                                (producto.ubicaciones[rackSel].MAX < producto.max_paquete ? producto.ubicaciones[rackSel].MAX:producto.max_paquete):
                                (producto.ubicaciones[rackSel].MAX < producto.maxQuantity ? producto.ubicaciones[rackSel].MAX:producto.maxQuantity);
                } else {
                    maximoPosible = producto.noBase && producto.max_paquete[producto.CHARG] == 0 ? 
                                (producto.ubicaciones[rackSel].MAX < producto.max_paquete[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.max_paquete[producto.CHARG]):
                                (producto.ubicaciones[rackSel].MAX < producto.maxQuantityLote[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.maxQuantityLote[producto.CHARG]);
                }

                if(maximoPosible <= 0) {
                    RNBeep.beep(false);
                    return ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                }
                producto.TCANT = parseInt(producto.TCANT ?? 0) + (maximoPosible < parseInt(producto.unidad_index.UMREZ) ? maximoPosible:parseInt(producto.unidad_index.UMREZ));
                
                if(producto.TCANT > maximoPosible) {
                    producto.TCANT = maximoPosible;
                }
                producto.force = false;
                setScanCurrent({...producto});
                if(autoinsert) {
                    setTimeout(() => saveProduct(producto),10);
                }
                if(producto.TCANT >= maximoPosible) {
                    RNBeep.beep(false);
                    return ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                }
                return RNBeep.beep(true);
            } else {
                return RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
            }
        } else { // Si no es el mismo procedemos a buscarlo en la lista de pedido.
            setScanCurrent({});
            setRackSel(null);
            let producto = {};
            for(const ped of pedido) {
                for(const unidad of ped.Producto.ProductosUnidads) {
                    if(unidad.EAN11 !== scancode) continue;
                    producto = ped;
                    producto.unidad_index = unidad;
                    producto.force = false;
                    producto.TCANT = 0;
                    try {  
                        const unidadBase = producto.UnidadBase?.MEINS || "ST";
                        if(producto.UnidadBase.XCHPF === 'X') { // Con lote
                            producto.maxQuantityLote = {
                                [producto.CHARG]: parseInt(producto.ProdConLote.CLABS)-parseInt(producto.RESERVADOS ?? 0)
                            };

                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = {};
                                producto.max_paquete[producto.CHARG] = Math.floor(producto.maxQuantityLote[producto.CHARG]/unidad.UMREZ);
                            } else {
                                producto.noBase = false;
                            }
                            producto.lotes = [{
                                label: producto.CHARG,
                                value: producto.CHARG,
                                subLabel: producto.ProdConLote.LAEDA+" - (Cant. "+producto.maxQuantityLote[producto.CHARG]+")"
                            }];
                        } else {
                            producto.maxQuantity = parseInt(producto.ProdSinLote?.LABST ?? 0)-parseInt(producto.RESERVADOS ?? 0);
                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = Math.floor(producto.maxQuantity/unidad.UMREZ);
                            } else {
                                producto.noBase = false;
                            }
                        }
                        producto.ubicaciones = getUbicaciones(producto);

                        return setScanCurrent({...producto});
                        
                        // No podemos sumar porque necesita la ubicación ajuro.
                        /*if(producto.UnidadBase.XCHPF !== 'X') { 
                            if(producto.noBase) { // No es es la BASE si no otra unidad
                                producto.TCANT = producto.max_paquete == 0 ? producto.maxQuantity:parseInt(producto.unidad_index.UMREZ);
                            } else {
                                producto.TCANT = producto.maxQuantity > 0 ? 1:0;
                            }
                            if(producto.TCANT >= parseInt(producto.maxQuantity)) {
                                RNBeep.beep(false);
                                ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                            }
                        } else {
                            if(producto.noBase) { // No es es la BASE si no otra unidad
                                producto.TCANT = producto.max_paquete[producto.CHARG] == 0 ? producto.maxQuantityLote[producto.CHARG]:parseInt(producto.unidad_index.UMREZ);
                            } else {
                                producto.TCANT = producto.maxQuantityLote[producto.CHARG] > 0 ? 1:0;
                            }
                            if(producto.TCANT >= parseInt(producto.maxQuantityLote[producto.CHARG])) {
                                RNBeep.beep(false);
                                ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                            }
                        }*/
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }
        RNBeep.beep(false);
        ToastAndroid.show("No hemos encontrado el artículo en la lista del pedido", ToastAndroid.SHORT);
    }

    const editarProducto = (find) => {
        //setRackSel(null);
        for(let producto of pedido) {
            if(producto.MATNR === find.MATNR && producto.CHARG === find.CHARG) {
                try {  
                    const unidad = producto.UnidadBase;
                    producto.unidad_index = unidad;
                    producto.noBase = false;
                    if(producto.UnidadBase.XCHPF === 'X') { // Con lote
                        producto.maxQuantityLote = {
                            [producto.CHARG]: parseInt(producto.ProdConLote.CLABS)-parseInt(producto.RESERVADOS ?? 0)
                        };
                        producto.lotes = [{
                            label: producto.CHARG,
                            value: producto.CHARG,
                            subLabel: producto.ProdConLote.LAEDA+" - (Cant. "+producto.maxQuantityLote[producto.CHARG]+")"
                        }];
                    } else {
                        producto.maxQuantity = parseInt(producto.ProdSinLote?.LABST ?? 0)-parseInt(producto.RESERVADOS ?? 0);
                    }
                    producto.ubicaciones = getUbicaciones(producto, find.UCRID, true);
                    producto.TCANT = find.TCANT;
                    producto.IDTRI = find.IDTRI;
                    producto.force = true;
                    setScanCurrent({...scanCurrent, ...producto});
                    if(find.IDADW === null) {
                        let index = producto.ubicaciones.length-1;
                        if(index < 0) index = 0;
                        if(index !== rackSel)
                            setRackSel(producto.ubicaciones.length-1);
                    } else {
                        for(let u=0;u < producto.ubicaciones.length;u++) {
                            if(producto.ubicaciones[u].UBI == find.IDADW) {
                                setRackSel(u);
                                break;
                            }
                        }
                    }
                    return;
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    const changeQuantity = (cantidad) => {
        if(rackSel === null) return;
        let cant = '';
        try {
            cant = cantidad.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }
        console.log("CAMBIAR CANTIDAD");
        let producto = JSON.parse(JSON.stringify(scanCurrent));
        if(!cant) {
            setScanCurrent({...producto, TCANT: 0});
            return inputCant1.current?.setNativeProps({text: cant});
        }
        let maximoPosible = 0;
        if(!producto.maxQuantityLote) {
            maximoPosible = producto.noBase && producto.max_paquete == 0 ? 
                        (producto.ubicaciones[rackSel].MAX < producto.max_paquete ? producto.ubicaciones[rackSel].MAX:producto.max_paquete):
                        (producto.ubicaciones[rackSel].MAX < producto.maxQuantity ? producto.ubicaciones[rackSel].MAX:producto.maxQuantity);
        } else {
            maximoPosible = producto.noBase && producto.max_paquete[producto.CHARG] == 0 ? 
                        (producto.ubicaciones[rackSel].MAX < producto.max_paquete[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.max_paquete[producto.CHARG]):
                        (producto.ubicaciones[rackSel].MAX < producto.maxQuantityLote[producto.CHARG] ? producto.ubicaciones[rackSel].MAX:producto.maxQuantityLote[producto.CHARG]);
        }
        if(parseInt(cant) > parseInt(maximoPosible)) {
            setScanCurrent({...producto, TCANT: parseInt(maximoPosible)});
        } else {
            setScanCurrent({...producto, TCANT: parseInt(cant)});
        }
    }

    function saveProduct(producto) {
        console.log(producto.TCANT);
        if((!producto.IDTRI && rackSel === null) || !producto.TCANT || producto.TCANT <= 0 || 
            (!producto.IDTRI && producto.TCANT > producto.ubicaciones[rackSel].MAX) || 
            (producto.maxQuantityLote && producto.TCANT > producto.maxQuantityLote[producto.CHARG]) || (producto.maxQuantity && producto.TCANT > producto.maxQuantity)) {
            RNBeep.beep(false);
            return ToastAndroid.show(
                "Por favor establece una cantidad dentro de los limites de lote y ubicación.",
                ToastAndroid.SHORT
            );
        }
        let existe = trasladoItems.filter(f => (producto.force && f.IDTRI === producto.IDTRI) || (!producto.force && f.MATNR === producto.MATNR 
            && f.CHARG === producto.CHARG && producto.ubicaciones[rackSel].UBI === f.IDADW && props.dataUser.IDUSR === f.UCRID && IDPAL === producto.IDPAL));

        let sumado = trasladoItems.reduce((prev, tra) => tra.MATNR === producto.MATNR && tra.CHARG === producto.CHARG && (existe[0]?.IDTRI !== tra.IDTRI) ? (prev+tra.TCANT):prev,producto.TCANT);
        let maxCantP = pedido.reduce((prev, ped) => ped.MATNR === producto.MATNR && ped.CHARG === producto.CHARG ? (prev+ped.CANTP):prev, 0);

        console.log(sumado, maxCantP);
        if(sumado > maxCantP) {
            RNBeep.beep(false);
            return ToastAndroid.show(
                "La cantidad colocada es mayor a la cantidad requerida.",
                ToastAndroid.SHORT
            );
        }
        console.log(existe);
        if(rackSel !== null && producto.ubicaciones?.length)
            producto.IDADW = producto.ubicaciones[rackSel].UBI;
        
        setLoadingSave(true);
        if(existe.length) {
            let datos = {
                id: existe[0].IDTRI,
                update: {
                    TCANT: parseInt(producto.TCANT),
                    UMOID: props.dataUser.IDUSR
                }
            };
            if(producto.COMNT) {
                datos.update.COMNT = producto.COMNT;
            }
            fetchIvan(props.ipSelect).put('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Productos actualizado: ", data.data);
                let prod = JSON.parse(JSON.stringify(trasladoItems));
                for(let i=0;i < prod.length;i++) {
                    if(prod[i].IDTRI === existe[0].IDTRI) {
                        let aux = {...prod[i], ...producto, ActualizadoPor: props.dataUser};
                        prod[i] = JSON.parse(JSON.stringify(aux));
                        console.log(prod[i]);
                        break;
                    }
                }
                setTrasladoItems([...prod]);
                ToastAndroid.show(
                    "Producto actualizado con éxito",
                    ToastAndroid.SHORT
                );
            })
            .catch(({status, error}) => {
                console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScanCurrent({});
                    getItems(true);
                }
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
            })
            .finally(() => {
                setLoadingSave(false);
            });
        } else {
            let datos = {
                create: {
                    IDTRA: traslado.IDTRA,
                    MATNR: producto.Producto.MATNR,
                    MAKTG: producto.Producto.MAKTG,
                    TCANT: parseInt(producto.TCANT),
                    UCRID: props.dataUser.IDUSR,
                    UMOID: props.dataUser.IDUSR,
                    IDPAL: IDPAL,
                    IDADW: producto.ubicaciones[rackSel].UBI,
                    CHARG: producto.CHARG
                }
            }

            fetchIvan(props.ipSelect).post('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Producto insertado", data.data);
                setTrasladoItems([{...producto, ...data.data, CreadoPor: props.dataUser, ActualizadoPor: props.dataUser, Ubicacion: producto.ArticulosBodegas[rackSel]}, ...trasladoItems]);
                setScanCurrent({...producto, ...data.data, CreadoPor: props.dataUser, ActualizadoPor: props.dataUser});

                ToastAndroid.show(
                    "Producto creado con éxito",
                    ToastAndroid.SHORT
                );
                inputScan.current?.focus();
            })
            .catch(({status, error}) => {
                //console.log(status, error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                if(status === 406) {
                    setTraslado({...traslado, TRSTS: error.status});
                    props.route.params.updateTras({...traslado, TRSTS: error.status});
                    props.navigation.goBack();
                    return ToastAndroid.show(
                        error?.text || "Solicitud no aceptada, por el servidor",
                        ToastAndroid.LONG
                    );
                }
                /*if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScanCurrent({});
                    get(true);
                }*/
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
            })
            .finally(() => {
                setLoadingSave(false);
            });
            
        }
    }

    const getUbi = (producto, ucrid = props.dataUser.IDUSR, force=false) => {
        if(!producto?.MATNR) return [];
        let contar = 0, idx = 0;
        let ubicaciones = [];
        console.log("Get ubi update");
        if(producto.ArticulosBodegas) {
            for(const ubi of producto.ArticulosBodegas) {
                const escaneados = props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 && !force ? 
                    trasladoItems.reduce((prev, tra) => tra.MATNR === producto.MATNR && tra.CHARG === producto.CHARG &&
                        tra.IDADW === ubi.IDADW && (tra.IDPAL !== IDPAL || tra.UCRID !== ucrid) ? (prev+tra.TCANT):prev, 0):0;
                let cantDisp = parseInt(ubi.QUANT ?? 0)-parseInt(ubi.RESERVADOS ?? 0)-parseInt(escaneados);
                console.log(ubi.QUANT, ubi.RESERVADOS, escaneados, cantDisp, props.dataUser.USSCO.indexOf('ADMIN_SCAN'))
                ubicaciones.push({
                    label: "Paleta ID: "+ubi.IDDWA,
                    subLabel: `${ubi.Bodega.FLOOR}-${ubi.Bodega.AISLE}-${ubi.Bodega.COLUM}-${ubi.Bodega.RACKS}-${ubi.Bodega.PALET} - (Cant. ${cantDisp})`,
                    value: idx,
                    MAX: cantDisp,
                    VALOR: ubi.IDDWA,
                    UBI: ubi.IDADW
                });
                contar += cantDisp;
                idx++;
            }
        }
        let diff = (!producto.CHARG ? producto.maxQuantity:producto.maxQuantityLote[producto.CHARG])-contar;
        if(diff > 0) {
            ubicaciones.push({
                label: 'S/N Ubicación',
                subLabel: 'Cant. '+diff,
                value: idx,
                MAX: diff,
                VALOR: 'sap',
                UBI: null
            });
        }
        return ubicaciones;
    }

    const getUbicaciones = useCallback((producto, ucrid, force=false) => getUbi(producto, ucrid, force), [props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 ? trasladoItems:undefined]);
    /* Funciones Scan */
    
    /* Componente Información */
    const DialogoInfo = () => 
        <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)}>
            <DialogHeader title={traslado.TRCON}/>
            <DialogContent>
                <Text style={styles.title2}>Paleta ID: {IDPAL}</Text>
                <Text>
                    <Text style={styles.title2}>Creado Por: </Text>
                    <Text style={styles.subtitle}>{`${traslado.CreadoPor?.USNAM||""} ${traslado.CreadoPor?.USLAS||""}`}</Text>
                </Text>
                {traslado.ActualizadoPor ? <Text>
                    <Text style={styles.title2}>Actualizado Por: </Text>
                    <Text style={styles.subtitle}>{`${traslado.ActualizadoPor?.USNAM||""} ${traslado.ActualizadoPor?.USLAS||""}`}</Text>
                </Text>:''}
                <Text style={{textAlign: 'justify'}}>
                    <Text style={styles.title2}>Fecha: </Text>
                    <Text style={styles.subtitle}>{traslado.DATEC.split("T")[0]+" "+traslado.DATEC.split("T")[1].substring(0,5)}</Text>
                </Text>
                <Text style={{textAlign: 'justify'}}>
                    <Text style={styles.title2}>Origen: </Text>
                    <Text style={styles.subtitle}>{traslado.DesdeCentro?.NAME1}{"\n"}({traslado.DesdeCentro?.Almacenes[0]?.LGOBE})</Text>
                </Text>
                <Text style={{textAlign: 'justify'}}>
                    <Text style={styles.title2}>Destino: </Text>
                    <Text style={styles.subtitle}>{traslado.HaciaCentro?.NAME1}{"\n"}({traslado.HaciaCentro?.Almacenes[0]?.LGOBE})</Text>
                </Text>
                <Text style={[styles.title1, {marginTop: 5, alignSelf: 'flex-start'}]}>Usuarios asignados: </Text>
                {traslado?.Paletas?.length && traslado?.Paletas[0]?.UsuariosAsignados?.map((user, index) =>
                <HStack key={index}>
                    <Text style={styles.small2}>{`· ${user.USNAM||""} ${user.USLAS||""} - ${!user.FINIC && !user.FFEND ? '(No iniciado)':(user.FINIC && !user.FFEND ? '(Escaneando...) '+timeDiff(user.FINIC):'(Finalizado)')} "${user.COMNT??''}"`}</Text>
                </HStack>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    title="Ok"
                    compact
                    variant="text"
                    onPress={() => setShowInfo(false)}
                />
            </DialogActions>
        </Dialog>
    ;

    const DialogoButtons = () =>
        <Dialog visible={openSheet} onDismiss={() => setOpenSheet(false)} style={{width: '100%'}}>
            <DialogContent>
                <VStack spacing={10} mt={20}>
                    {cronometro.FINIC && !cronometro.FFEND &&
                    <Button
                        variant="outlined"
                        color="#000"
                        onPress={() => {setOpenSheet(false); cerrarScan()}}
                        title="Finalizar Escaneo"
                        containerStyle={{marginTop: 10}}/>
                    }
                    {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 && traslado.TRSTS === 1 && trasladoItems.length &&
                    <Button
                        variant="outlined"
                        color="#000"
                        onPress={() => {setOpenSheet(false); finalizarTraslado()}}
                        title="Finalizar Traslado"/>
                    }
                    <Button
                        color={Global.colorMundoTotal}
                        onPress={() => setOpenSheet(false)}
                        title="Cancelar"/>
                </VStack>
            </DialogContent>
        </Dialog>
    ;

    const DialogoComentario = () =>
        <Dialog visible={comentario !== -2}>
            <DialogHeader title="Agrega un comentario"/>
            <DialogContent>
                <TextInput placeholder="Comenta todos los detalles posibles" 
                    autoFocus
                    ref={inputComentario}
                    maxLength={1000}
                    onChangeText={(text) => inputComentario.current ? inputComentario.current.value = text:''}
                    multiline
                />
            </DialogContent>
            <DialogActions>
                <HStack spacing={10}>
                    <Button
                        variant="outlined"
                        color="#000"
                        onPress={() => setComentario(-2)}
                        title="Cancelar"/>
                    <Button
                        loading={loadingSave}
                        disabled={loadingSave}
                        color={Global.colorMundoTotal}
                        onPress={() => {
                            let comentarioText = inputComentario.current?.value ?? '';
                            if(comentarioText.length < 10) {
                                return ToastAndroid.show("Tu comentario debe contener al menos 10 carácteres", ToastAndroid.SHORT);
                            }
                            setComentario(-2);
                            if(comentario === -1) {
                                cerrarScanFinal(comentarioText);
                            } else if(comentario >= 0) {
                                saveProduct({...trasladoItems[comentario], COMNT: comentarioText, force: true});
                            }
                        }}
                        title="Ok"/>
                </HStack>
            </DialogActions>
        </Dialog>
    ;
    /* Componente Información */

    /* Componente de lista */
    const RowProducts = (item, index) => 
        <Pressable onPress={() => item.COMNT ? Alert.alert("Comentario", item.COMNT):''} key={index}>
            <HStack
                spacing={4}
                style={[styles.items,(
                    (scanCurrent.IDTRI === item.IDTRI && rackSel !== null && scanCurrent.ubicaciones[rackSel]?.UBI === item.IDADW && scanCurrent.force) || 
                    (rackSel !== null && scanCurrent.MATNR === item.MATNR && scanCurrent.CHARG === item.CHARG && IDPAL === item.IDPAL
                        && scanCurrent.ubicaciones[rackSel].UBI === item.IDADW && props.dataUser.IDUSR === item.UCRID && !scanCurrent.force) 
                    ? {backgroundColor: '#5dff803d'}:{}), {width: '100%'}]}
            >
                <VStack w="55%">
                    <Text style={styles.title2} numberOfLines={2}>{item.MAKTG || item.Producto.MAKTG || ""}</Text>
                    <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]} numberOfLines={1}>{item.unidad_index?.EAN11 || item.MATNR}</Text>
                    {item.CHARG && traslado.TRSTS === 1 && <Text style={styles.subtitle} color="primary" numberOfLines={1}>Lote: {item.CHARG}</Text>}
                    <Text style={styles.subtitle} numberOfLines={1}>Usuario: {item.CreadoPor?.USNAM+" "+(item.CreadoPor?.USLAS ?? '')}</Text>
                    <Text style={[styles.small3, {fontWeight: 'bold'}]} color="primary" numberOfLines={1}>Ubicación: {!item.Ubicacion ? 'S/N':(item.Ubicacion?.Bodega?.FLOOR+"-"+item.Ubicacion?.Bodega?.AISLE+"-"+item.Ubicacion?.Bodega?.COLUM+"-"+item.Ubicacion?.Bodega?.RACKS+"-"+item.Ubicacion?.Bodega?.PALET)}</Text>
                    <Text style={styles.subtitle} numberOfLines={1}>Paleta: {item.IDPAL}</Text>
                </VStack>

                {traslado.TRSTS === 1 && cronometro.FINIC && !cronometro.FFEND ? <VStack w="25%" style={{justifyContent: 'space-between'}}>
                    <Text style={styles.small3}>Cantidad: {item.TCANT}</Text>
                    <Button onPress={() => setComentario(index)} color={Global.colorMundoTotal}
                        variant="outlined" title="Comentario" compact={true} loading={loadingSave} titleStyle={{fontSize: 8}}/>
                    <Button onPress={() => editarProducto(item)} buttonStyle={{padding: 0}} containerStyle={{padding: 0}} contentContainerStyle={{padding: 0}}
                        variant="outlined" title="Editar" compact={true} loading={loadingSave} style={{marginBottom: 5, padding: 0}} titleStyle={{fontSize: 11}}/>
                </VStack>:
                <VStack w="30%">
                    <Text style={styles.subtitle}>Cantidad:</Text>
                    <Text style={styles.quantity}>{item.TCANT}</Text>
                    {item.CHARG && <Text style={styles.subtitle}>Lote:</Text> }
                    {item.CHARG && <Text style={styles.lote}>{item.CHARG}</Text>}
                    {/* <Text style={styles.subtitle}>{getCantUnidades(item)}</Text> */}
                </VStack>}
                {traslado.TRSTS === 1 && cronometro.FINIC && !cronometro.FFEND ?
                    <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => deleteItem(item)} style={{alignSelf: 'center'}}/>:''
                }
            </HStack>
        </Pressable>
    ;

    const memoRows = useCallback((item, index) => RowProducts(item, index), [trasladoItems, scanCurrent, loadingSave, traslado, rackSel, cronometro?.FFEND])
    /* Componente de lista */

    /* Otras funciones */
    const finalizarTraslado = async () => {
        //if(!cronometro.FFEND) return Alert.alert('Error', 'Finaliza tu sesión antes de cerrar el escaneo');
        Alert.alert('Confirmar', `¿Deseas finalizar la carga de productos del traslado?`, [
            {
              text: 'Si deseo finalizar',
              style: 'destructive',
              onPress: async () => {
                let result = await getTrasladoItems(true, false);
                if(!result) return;
    
                let result2 = await props.updatePedido(false);
                if(!result2) return;

                let checkPedido = false;
                for(const ped of result2) {
                    let sumar = result.reduce((prev, tri) => ped.MATNR === tri.MATNR && ped.LOTEA === tri.CHARG ? (prev+tri.TCANT):prev, 0);
                    let cantp_total = result2.reduce((prev, it) => it.MATNR===ped.MATNR && it.CHARG === ped.CHARG ? (prev+it.CANTP):prev,0);
                    if(sumar < cantp_total) {
                        checkPedido = true;
                        //break;
                    } else if(sumar > cantp_total) {
                        return ToastAndroid.show('Hay productos mayores a los solicitados por favor verifica', ToastAndroid.LONG);
                    }
                    //console.log(ped.ArticulosBodegas);
                    for(const ubi of ped.ArticulosBodegas) { // Verificar cantidades en ubicacion
                        let sumaTra = result.reduce((prev, tri) => ubi.MATNR === tri.MATNR && ubi.LOTEA === tri.CHARG && ubi.IDADW === tri.IDADW ? (prev+tri.TCANT):prev, 0);
                        console.log(sumaTra, ubi.QUANT, ubi.MATNR);
                        if(sumaTra > ubi.QUANT) {
                            return Alert.alert(`Error en ubicación ${ubi.IDADW}`, `El artículo ${ped.Producto.MAKTG} (${ubi.MATNR}), sobre pasa la cantidad disponible de la ubicación por favor verifica`);
                        }
                    }
                }
                if(checkPedido) {
                    ToastAndroid.show('Faltan productos por escanear', ToastAndroid.LONG);
                    Alert.alert('Confirmar', `Faltan productos por escanear\n¿Deseas cerrar igualmente?`, [
                        {
                            text: 'Si deseo finalizar',
                            style: 'destructive',
                            onPress: () => finalizarPost() // Debemos obligar un comentario
                        },
                        {
                        text: 'No',
                        style: 'cancel',
                        }
                    ]);
                } else {
                    finalizarPost();
                }
            }
                
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        }]);
    }

    const finalizarPost = () => {
        setLoading(true);
        let datos = {
            id: traslado.IDTRA,
            update: {
                TRSTS: 2
            }
        }
        //console.log(scanSelect, datos);
        fetchIvan(props.ipSelect).put('/crudTraslados', datos, props.token.token)
        .then(({data}) => {
            //console.log(data);
            setTraslado({...traslado, TRSTS: 2});
            props.route.params.updateTras({...traslado, TRSTS: 2});

            ToastAndroid.show(
                "Carga de traslado finalizado con éxito",
                ToastAndroid.SHORT
            );
        })
        .catch(({status, error}) => {
            //console.log(status, error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            if(status === 406) {
                setTraslado({...traslado, TRSTS: error.status});
                props.route.params.updateTras({...traslado, TRSTS: error.status});
                props.navigation.goBack();
                
                return ToastAndroid.show(
                    error?.text || "Solicitud no aceptada, por el servidor",
                    ToastAndroid.LONG
                );
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    const deleteItem = (producto) => {
        //console.log("Delete items")
        Alert.alert('Confirmar', `¿Deseas eliminar el ítem (${producto.MAKTG}) realmente?`, [
            {
              text: 'Si deseo eliminar',
              style: 'destructive',
              onPress: () => {
                let datos = {
                    id: producto.IDTRI
                };
                setLoading(true);
                fetchIvan(props.ipSelect).delete('/crudTrasladoItems', datos, props.token.token)
                .then(({data}) => {
                    console.log("Productos borrados: ", data.data);
                    setTrasladoItems(trasladoItems.filter(f => f.IDTRI !== producto.IDTRI));
                    setScanCurrent({});
                    setRackSel(null);
                    
                    ToastAndroid.show(
                        "Producto eliminado con éxito",
                        ToastAndroid.SHORT
                    );
                })
                .catch(({status, error}) => {
                    //console.log(status, error);
                    if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                        setMsgConex("¡Ups! Parece que no hay conexión a internet");
                    }
                    if(status === 406) {
                        setTraslado({...traslado, TRSTS: error.status});
                        props.route.params.updateTras({...traslado, TRSTS: error.status});
                        props.navigation.goBack();
                        
                        return ToastAndroid.show(
                            error?.text || "Solicitud no aceptada, por el servidor",
                            ToastAndroid.LONG
                        );
                    }
                    return ToastAndroid.show(
                        error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                        ToastAndroid.SHORT
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            },
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        }
    ]);
    }

    const cerrarScanFinal = (message=null) => {
        const datos = {
            IDTRA: traslado.IDTRA,
            IDPAL: IDPAL
        };
        if(message) {
            datos.COMNT = message;
        }

        fetchIvan(props.ipSelect).put('/sesionScan', datos, props.token.token, undefined, undefined, 60000) // 1 minuto para probar
        .then(({data}) => {
            console.log(data);
            if(data.update[0] === 1) {
                setCronometro({
                    ...cronometro, FFEND: (new Date()).toString()
                })
            }
        })
        .catch(({status, error}) => {
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        });
    }

    const cerrarScan = () => {
        console.log("Cerrando scan");
        Alert.alert('Confirmar', `¿Deseas finalizar tu sesión de escaneo?`, [
            {
              text: 'Si deseo finalizar',
              style: 'destructive',
              onPress: () => {
                let checkPedido = false;
                for(let ped of pedido) {
                    let sumar = 0;
                    for(let tra of trasladoItems) {
                        if(ped.MATNR === tra.MATNR && ped.CHARG === tra.CHARG) {
                            sumar += tra.TCANT;
                        }
                    }
                    let cantp_total = pedido.reduce((prev, it) => it.MATNR===ped.MATNR && it.CHARG === ped.CHARG ? (prev+it.CANTP):prev,0);
                    if(sumar < cantp_total) {
                        checkPedido = true;
                        break;
                    } else if(sumar > cantp_total) {
                        return ToastAndroid.show('Hay productos mayores a los solicitados por favor verifica', ToastAndroid.LONG);
                    }
                }
                if(checkPedido) {
                    ToastAndroid.show('Faltan productos por escanear', ToastAndroid.LONG);
                    Alert.alert('Confirmar', `Faltan productos por escanear\n¿Deseas cerrar igualmente?`, [
                        {
                            text: 'Si deseo finalizar',
                            style: 'destructive',
                            onPress: () => setComentario(-1) // Debemos obligar un comentario
                        },
                        {
                        text: 'No',
                        style: 'cancel',
                        }
                    ]);
                } else {
                    cerrarScanFinal();
                }
            }
                
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        }
    ]);
    }
    /* Otras funciones */

    return (
        <Provider>
            <Stack spacing={0} m={2} mb={-4}>
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                <ScrollView ref={scrollPrincipal} nestedScrollEnabled = {true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> getTrasladoItems(true)}/>}>
                    <DialogoInfo/>

                    <HStack style={{justifyContent: 'space-between'}}>
                        <Crono cronometro={cronometro}/>
                        <Text style={[styles.subtitle]} onPress={() => setShowInfo(!showInfo)}><Entypo name="info-with-circle" size={18} color={Global.colorMundoTotal}/> Información</Text>
                    </HStack>
                    <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>

                    {traslado.TRSTS === 1 ? 
                        cronometro.FINIC && !cronometro.FFEND ?
                        <View> 
                            <VStack spacing={-8}>
                                <TextInput placeholder="Pulsa y escanea o tipea el código de barras" 
                                    onEndEditing={(e) => findCode(e.nativeEvent.text) }
                                    showSoftInputOnFocus={showKeyBoard}
                                    ref={inputScan}
                                    maxLength={18}
                                />

                                <HStack style={{alignItems:'center', alignSelf: 'center'}}>
                                    <Text style={styles.small2}>Activar teclado</Text>
                                    <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                                </HStack>

                                <HStack style={{justifyContent: 'space-between'}}>
                                    <HStack style={{alignItems:'center'}}>
                                        <Text style={styles.small2}>Auto sumar</Text>
                                        <Switch value={autosumar} onValueChange={() => setAutoSumar(!autosumar)} autoFocus={false}/>
                                    </HStack>
                                    <HStack style={{alignItems:'center'}}>
                                        <Text style={styles.small2}>Auto guardado</Text>
                                        <Switch value={autoinsert} onValueChange={() => setAutoInsert(!autoinsert)} autoFocus={false}/>
                                    </HStack>
                                </HStack>
                            </VStack>

                            <Box style={styles.box1}>
                                {scanCurrent?.MATNR ? 
                                <Stack spacing={0}>
                                    <HStack style={{justifyContent: 'space-between'}} spacing={4}>
                                        <VStack spacing={0} w={"65%"}>
                                            <HStack spacing={4}>
                                                <Text style={styles.title2}>Código:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.unidad_index?.EAN11}</Text>
                                            </HStack>
                                            <HStack spacing={4}>
                                                <Text style={styles.title2}>Und. de escaneo:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.unidad_index?.UnidadDescripcion?.MSEHL || ""}</Text>
                                                {scanCurrent.noBase && <Text style={styles.small3}>({scanCurrent.maxQuantityLote ? scanCurrent.max_paquete[scanCurrent.CHARG]:scanCurrent.max_paquete} completos)</Text>}
                                            </HStack>
                                            {scanCurrent.noBase && <Text style={styles.small3}>{parseInt(scanCurrent.unidad_index.UMREZ)+" "+scanCurrent.UnidadBase?.UnidadDescripcion?.MSEHL+". Por "+(scanCurrent.unidad_index?.UnidadDescripcion?.MSEHL || "")}</Text>}
                                            <HStack spacing={4} style={{width: '80%', flexWrap: 'nowrap'}}>
                                                <Text style={styles.title2}>Producto:</Text>
                                                <Text style={styles.subtitle}>{scanCurrent.Producto.MAKTG}</Text>
                                            </HStack>
                                            <Text style={styles.subtitle}>{scanCurrent.Producto.MATNR}</Text>
                                        </VStack>
                                        <Stack w={"35%"}>
                                            <ImagesAsync ipSelect={props.ipSelect} imageCode={scanCurrent.MATNR} token={props.token.token}/>
                                        </Stack>
                                    </HStack>

                                    <HStack style={{justifyContent: 'space-between', alignItems: 'flex-end'}}>
                                        <Text style={styles.title1}>{getCantUnidades(scanCurrent)}</Text>
                                        <VStack style={{ alignItems: 'flex-end'}}>
                                                <Text style={[styles.small2]}>Ubicación:</Text>
                                                <SelectInput
                                                searchable={true}
                                                data={scanCurrent.ubicaciones}
                                                value={rackSel}
                                                setValue={(val) => {if(scanCurrent.force) {setScanCurrent({...scanCurrent, force: false});} setRackSel(val);}}
                                                title="Ubicación"
                                                buttonStyle={{minWidth: 120, height: 'auto'}}
                                                titleStyle={{fontSize: 11}}
                                                disabled={scanCurrent.force}
                                            />
                                        </VStack>
                                    </HStack>
                                    <HStack spacing={5} mt={0} style={{justifyContent: 'space-between'}}>
                                        {scanCurrent.CHARG && 
                                        <VStack style={{ alignSelf: 'center'}}>
                                                <Text style={[styles.small2, {fontWeight: 'bold'}]}>Lotes:</Text>
                                                <SelectInput
                                                searchable={false}
                                                data={scanCurrent.lotes}
                                                value={scanCurrent.CHARG}
                                                setValue={() => console.log("Selecciona lote")}
                                                title="Lotes"
                                                buttonStyle={{minWidth: 120}}
                                            />
                                        </VStack>}
                                        <VStack mt={-3} spacing={2} style={{justifyContent: 'flex-end'}}>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Requerida:</Text>
                                                <Text style={styles.title2}>{scanCurrent.CANTP}</Text>
                                            </HStack>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Disp Máx:</Text>
                                                <Text style={styles.title2}>{scanCurrent.maxQuantityLote ? scanCurrent.maxQuantityLote[scanCurrent.CHARG]:scanCurrent.maxQuantity}</Text>
                                            </HStack>
                                            <HStack m={0} spacing={1} style={styles.cantText}>
                                                <Text style={styles.small3}>Cant. Disp. Ubi:</Text>
                                                <Text style={styles.title2}>{rackSel !== null ? scanCurrent.ubicaciones[rackSel]?.MAX:0}</Text>
                                            </HStack>
                                            <TextInput
                                                ref={inputCant1}
                                                //defaultValue={scanCurrent.TCANT?.toString()} 
                                                value={scanCurrent.TCANT?.toString()} 
                                                onChangeText={(text) => changeQuantity(text)} 
                                                //onEndEditing={(e) => inputCant1.current?.focus()}
                                                numeric
                                                keyboardType="numeric"
                                                editable={((scanCurrent.maxQuantityLote && scanCurrent.maxQuantityLote[scanCurrent.CHARG] > 0) || scanCurrent.maxQuantity > 0) && rackSel !== null ? true:false}
                                                placeholder="10"
                                                textAlign={'center'}
                                                inputStyle={{marginTop: -18}}
                                                inputContainerStyle={{
                                                    height: 30,
                                                    padding: 10}}
                                                    style={{alignItems: 'flex-end', width: 145, flexWrap: 'nowrap'}}
                                                maxLength={10}
                                                />
                                        </VStack>
                                    </HStack>
                                    <Button color="secondary" 
                                        loading={loadingSave}
                                        title="Cargar"
                                        trailing={props => <MaterialCommunityIcons name="send" {...props} size={20}/>} 
                                        style={{marginTop: 5}} 
                                        onPress={() => saveProduct(JSON.parse(JSON.stringify(scanCurrent)))} 
                                        disabled={loadingSave || !scanCurrent.TCANT || rackSel === null}/>
                                </Stack>
                                :''}
                            </Box>
                        </View>:
                        <View>
                            <VStack m={10}>
                                <Text style={{textAlign: 'justify', fontSize: 12}}>Para comenzar el escaneo presiona el siguiente botón. Recuerda que al comenzar se debe culminar en el menor tiempo posible para ir mejorando tus estadisticas.</Text>
                                <Button title="Iniciar Escaneo" color={Global.colorMundoTotal} onPress={() => !loading && pedido.length ? iniciarEscaneo():''} disabled={loading || (!pedido.length ? true:false) || cronometro.FFEND ? true:false}/>
                            </VStack>
                        </View>
                    :''}
                    {loading ? <ActivityIndicator />:''}
                    <Stack style={styles.escaneados}>
                        <HStack spacing={2} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={styles.title2}>Productos escaneados ({trasladoItems?.filter(f => f.TCANT > 0).length}):</Text>
                            {(props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 && props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 1 && trasladoItems.length) || 
                            (cronometro.FINIC && !cronometro.FFEND) ? 
                                <Button compact={true} variant="text" color="secondary" onPress={() => setOpenSheet(true)} 
                                    disabled={loading || loadingSave} loading={loading || loadingSave} 
                                    leading={<Entypo name="menu" size={24}/>}/>:
                                ''
                            }
                        </HStack>
                        <ListaPerform 
                            items={props.dataUser.USSCO.indexOf('ADMIN_SCAN') !== -1 || cronometro?.FINIC || traslado.TRSTS > 1 ? trasladoItems:[]} 
                            renderItems={memoRows} 
                            heightRemove={traslado.TRSTS === 1 ? (scanCurrent?.MATNR  ? 125:280):160}
                            height={125}
                            forceHeight={false}
                            />
                    </Stack>
                    <View style={{ width: 200, height: 10 }}></View>
                </ScrollView>
            </Stack>
            <DialogoButtons/>
            <DialogoComentario/>
        </Provider>
    )
}

export default ScaneoPedido;

const styles = StyleSheet.create({
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    title2: {
        zIndex: 9,
        fontSize: 14,
        fontWeight: '500'
    },
    small: {
        fontSize: 10
    },
    small2: {
        fontSize: 11,
    },
    small3: {
        fontSize: 12,
    },
    subtitle: {
        fontSize: 13,
    },
    box: {
        marginTop: 10,
        padding: 5,
        backgroundColor: "lightgrey",
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    box1: {
        zIndex: 10,
        backgroundColor: "lightgrey",
        padding: 3,
        width: '99%',
        flexWrap: 'nowrap',
        //maxWidth: 400
    },
    escaneados: {
        marginTop: 10,
        zIndex: 9,
    },
    items: {
        justifyContent: 'space-between', 
        marginBottom: 1, 
        borderBottomWidth: 1
    },
    title_small: {
        zIndex: 9,
        fontSize: 11,
        fontWeight: '500'
    },
    quantity: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center'
    },
    lote: {
        fontSize: 12,
        fontWeight: 'bold'
    }, 
    cantText: {
        justifyContent: 'space-between',
        alignItems: 'flex-end', 
        width: 'auto', 
        flexWrap: 'nowrap'
    }
});

const Crono = ({cronometro}) => {
    const [diff, setDiff] = useState('');

    useEffect(() => {
        if(cronometro.FINIC && !cronometro.FFEND) {
            let interval = setInterval(() => setDiff(timeDiff(cronometro.FINIC)), 1000);
            return () => {
                clearInterval(interval);
            }
        } else if(cronometro.FINIC && cronometro.FFEND) {
            setDiff(timeDiff(cronometro.FINIC,cronometro.FFEND))
        }
    }, [cronometro]);

    return <Text style={[styles.subtitle]}>{cronometro.FINIC ? "Tiempo escaneo: "+diff:""}</Text>
};

function timeDiff(timeStart, timeEnd=null) {
    if(!timeStart) return '';
    let dateNow = timeEnd ? new Date(timeEnd.replace("Z","")):new Date();

    let seconds = Math.floor((dateNow - (new Date(timeStart.replace("Z",""))))/1000);
    let minutes = Math.floor(seconds/60);
    let hours = Math.floor(minutes/60);
    let days = Math.floor(hours/24);

    hours = hours-(days*24);
    minutes = minutes-(days*24*60)-(hours*60);
    seconds = seconds-(days*24*60*60)-(hours*60*60)-(minutes*60);

    return (days > 0 ? days+"d ":'')+hours+"h "+minutes+"m "+seconds+"s";
}

function getPrural(texto) {
    switch(texto) {
        case 'Par':
            return 'Pares'
        case 'Bulto':
            return 'Bultos'
        case 'Pieza':
            return 'Piezas'
        case 'Unidad':
            return 'Unidades'
        case 'Caja':
            return 'Cajas'
        case 'Metro':
            return 'Metros'
        default: 
            return texto.split(" ")[0]
    }
}
function getCantUnidades(producto) {
    let cantidad = parseInt(producto.TCANT);
    let paquete = Math.floor(cantidad/producto.unidad_index.UMREZ);
    let unidad = cantidad - (paquete*producto.unidad_index.UMREZ);
    if(!cantidad) return "";

    if(producto.noBase) {
        return (paquete == 0 || paquete > 1 ? getPrural(producto.unidad_index.UnidadDescripcion.MSEHL):producto.unidad_index.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
            +(unidad == 0 || unidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
    }
    return (cantidad == 0 || cantidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
}