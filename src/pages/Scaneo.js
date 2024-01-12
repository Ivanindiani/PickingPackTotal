import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import VirtualList from "../components/_virtualSelect";
import RNBeep from 'react-native-a-beep';
import ImagesAsync from "../components/_imagesAsync";
import KeyEvent from 'react-native-keyevent';
const Global = require('../../app.json');

import { LogBox } from 'react-native';
import ListaPerform from "../components/_virtualList";

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

var lotes = [];
var mode = {};
//var items = [];
//import ScannerReceiverForUrovo from "../components/_scannerModule";

var cantidadInput1 = "";
const Scaneo = (props) => {
    //const [scancode, setScanCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [items, setItems] = useState([]);
    const [scanSelect, setScan] = useState({});
    //const [mode, setMode] = useState({});
    const [traslado, setTraslado] = useState(props.route.params.traslado);
    const [loteSel, setLoteSel] = useState(null);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [autosumar, setAutoSumar] = useState(true);
    const [autoinsert, setAutoInsert] = useState(true);
    const [showInfo, setShowInfo] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [cant1, setCant1] = useState(cantidadInput1);
    //const [verItems, setVerItems] = useState(false);

    const inputScan = useRef(null);
    const otroInput = useRef(null);
    const inputCant1 = useRef(null);
    const scrollShow = useRef(null);


    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true])

    /*useEffect( () =>{
        console.log("INIT SCANNER RECEIVED");

        async function hola() {
            console.log(await ScannerReceiverForUrovo.getReferrerData());
            //console.log(await ScannerReceiver.createCalendarEvent("hola", "Caracas"))
        }

        hola();
        //let retorname = await ScannerReceiver.createCalendarEvent('testName', 'testLocation');
        
        //console.log(retorname);
        const emitter =DeviceEventEmitter.addListener('ScannerBroadcastReceiver', function (map) {
            console.log('Scanner content is: ' + map.referrer);
            //inputScan.current?.focus();
            //inputScan.current?.setNativeProps({text: map.referrer});
            //codeFind(map.referrer)
            //inputScan.current?.submit();
        });
        

        console.log(emitter);

        return () => {
            console.log("unmount")
            emitter?.remove();
            //DeviceEventEmitter.removeAllListeners();
            //DeviceEventEmitter.removeListener('ScannerBroadcastReceiver'); 
        }
    },[]);*/

     // Evento alternativo para detectar el escaneo
    const evento = (keyEvent) => { 
        /*if(keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) { // Nos llaman con enter
            //if(verItems)
                setVerItems(false);
        }*/
        console.log(`Key: ${keyEvent.pressedKey}`);
        console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
        //console.log("FOCUS?",otroInput.current?.isFocused());
        if(!inputScan.current?.isFocused() && !otroInput.current?.isFocused() && !inputCant1.current?.isFocused()) {
            //console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
            //console.log(`Action: ${keyEvent.action}`);
            //console.log(`Key: ${keyEvent.pressedKey}`);
            
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                console.log("Activamos ")
                inputScan.current?.focus();
                scrollShow.current?.scrollTo({y: 20, animated: true});
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                    scrollShow.current?.scrollTo({y: 20, animated: true});
                }
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                    scrollShow.current?.scrollTo({y: 20, animated: true});
                }
            }
        }
    }

    useEffect(() => {// Efecto para detectar si va para atras
        let before = props.navigation.addListener('beforeRemove', (e) => {
            //console.log("Mount listener info")
            e.preventDefault();
            if(!showInfo) {
                Alert.alert('Escaneo de productos', '¿Deseas realmente salir de la ventana de escaneo de productos?',
                [{
                    text: 'No', style: 'cancel'
                },{
                    text: 'Si', style: 'destructive', onPress: () => props.navigation.dispatch(e.data.action)
                }])
            } else {
                //console.log("Hola");
                setShowInfo(false)
            }
        });

        return () => {
            //console.log("Remove listener info");
            before();
        }
    }, [props.navigation, showInfo]);
    
    useEffect(() => { // Efecto de montura del componente
        getItems();
        
        if(traslado.TRSTS === 1) {
            //console.log("Mount listerner key")
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        }
    }, []);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        setTimeout(() => {
            inputScan.current?.focus()
        }, 100);
    },[showKeyBoard, autosumar, autoinsert, scanSelect]);

    /*useEffect(() => { // Efecto para detectar el modo de carga de datos insert/update
        if(!lotes.length && mode.mode && scanSelect.Producto && autoinsert && !mode.noPush && scanSelect.TCANT > 0) {
            //console.log("Me llaman actualizar");
            if(mode.mode === 'update' && !autosumar) return; // Debuguear
            saveProduct();
        }
    }, [mode, !scanSelect]);*/

    useEffect(() => { // Efecto cuando cambia el lote cambiamos modo
        //console.log({...mode, lote: loteSel});
        if(loteSel) {
            let encontrar = false;
            inputCant1.current.setNativeProps({text: ""})
            for(let item of items) {
                if(item.CHARG == loteSel) {
                    //console.log("Encontramos el lote en la lista: ", item.quantity_usar)
                    encontrar = true;
                    inputCant1.current.setNativeProps({text: item.quantity_usar})
                    item.TCANT = parseInt(item.quantity_usar)
                    setCant1(item.TCANT);
                    setScan(item);
                    //setMode({...mode, lote: loteSel});
                    break;
                }
            }
            mode = {
                mode: encontrar ? 'update':'insert', 
                lote: loteSel
            };
        } else {
            mode = {mode: mode.mode, lote: loteSel};
        }
    }, [loteSel]);
    
    function getItems(forceCheck = false) { // El force check es para avisar al usuario si hay productos con stock sobre pasados
        let datos = [
            `find={"IDTRA": ${traslado.IDTRA}}`,
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            `checkProducts=${traslado.TRSTS === 1}`,
            `simpleData=true`
        ];
        
        setLoading(true);
        return new Promise((resolve) => {
            let passed = 0;
            fetchIvan(props.ipSelect).get('/crudTrasladoItems', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
            .then(({data}) => {
                if(data.data.length) passed = true;
                if(traslado.TRSTS === 1) {
                    for(let producto of data.data) {
                        const unidadBase = producto.Producto.UnidadBase?.MEINS || "ST";
                        producto.quantity_usar = parseInt(producto.TCANT).toString();
                        try {
                            if(producto.Producto.ProdConLotes.length) {
                                producto.maxQuantityLote = {};
                                if(producto.quantities?.length) {
                                    for(let lote of producto.Producto.ProdConLotes) {
                                        for(let quan1 of producto.quantities) {
                                            if(quan1.CHARG == lote.CHARG) {
                                                producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS)-parseInt(quan1.quantity_used);
                                            } else {
                                                if(!producto.maxQuantityLote[lote.CHARG]) 
                                                    producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                                            }
                                        }
                                    }
                                } else {
                                    for(let lote of producto.Producto.ProdConLotes) {
                                        producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                                    }
                                }
     
                            } else {
                                let quantity_used = producto.quantities.reduce((prev, q) => parseInt(prev)+parseInt(q.quantity_used),0);
                                producto.maxQuantity = parseInt(producto.Producto.ProdSinLotes[0]?.LABST || 0)-parseInt(quantity_used);
                            }
    
                            for(let unidad of producto.Producto.ProductosUnidads) {
                                if(unidad.MEINH === unidadBase) {
                                    producto.unidad_index = unidad;
                                    producto.noBase = false;
                                    break;
                                }
                            }
                            if(forceCheck) {
                                if(producto.CHARG) {//Lote
                                    if(producto.TCANT > producto.maxQuantityLote[producto.CHARG]) {
                                        //console.log("El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea la lista.");
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea la lista.");
                                        passed = false;
                                    }
                                } else {
                                    if(producto.TCANT > producto.maxQuantity) {
                                        //console.log("El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea la lista.");
                                        Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea la lista.");
                                        passed = false;
                                    }
                                }
                            }
                        } catch (e) {
                            //console.log(e);
                        }
                    }
                }
                setItems(data.data);
                //items = data.data;
                //console.log("Productos listados: ", data.data.length);
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
                passed = false;
            })
            .finally(() => {
                setLoading(false);
                resolve(passed)
            });
        })
    }

    function checkProduct(code, id, newQuantity) {
        let datos = [
            `trasladoId=${traslado.IDTRA}`,
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            `code=${code}`
        ];
        
        fetchIvan(props.ipSelect).get('/checkProduct', datos.join('&'), props.token.token)
        .then(({data}) => {
            if(!data.data.length) return; // No hay otras cantidades dejamos quieto
            let itemsAux = JSON.parse(JSON.stringify(items));
            for(let producto of itemsAux) {
                if(producto.IDTRI === id) { // Buscamos el producto en los items
                    producto.quantities = data.data;
                    producto.TCANT = newQuantity;
                    producto.quantity_usar = newQuantity.toString();
                    try {
                        if(producto.Producto.ProdConLotes.length) {
                            producto.maxQuantityLote = {};
                            if(producto.quantities?.length) {
                                for(let lote of producto.Producto.ProdConLotes) {
                                    for(let quan1 of producto.quantities) {
                                        if(quan1.CHARG == lote.CHARG) {
                                            producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS)-parseInt(quan1.quantity_used);
                                        } else {
                                            if(!producto.maxQuantityLote[lote.CHARG]) 
                                                producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                                        }
                                    }
                                }
                            } else {
                                for(let lote of producto.Producto.ProdConLotes) {
                                    producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                                }
                            }
                        } else {
                            let quantity_used = producto.quantities.reduce((prev, q) => parseInt(prev)+parseInt(q.quantity_used),0);
                            producto.maxQuantity = parseInt(producto.Producto.ProdSinLotes[0]?.LABST || 0)-parseInt(quantity_used);
                        }
                        //console.log("Cehck maxqtity: "+producto.maxQuantity)
                        
                        if(producto.CHARG) {//Lote
                            if(producto.TCANT > producto.maxQuantityLote[producto.CHARG]) {
                                //console.log("El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea.");
                                Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Lote: "+producto.CHARG+"\nExcede la cantidad disponible, por favor chequea.");
                                passed = false;
                            }
                        } else {
                            if(producto.TCANT > producto.maxQuantity) {
                                //console.log("El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea.");
                                Alert.alert("Exceso de cantidad", "El producto: "+producto.MAKTG+". Excede la cantidad disponible, por favor chequea.");
                                passed = false;
                            }
                        }
                        if(producto.MATNR === scanSelect.MATNR) {
                            setScan(producto);
                        }
                    } catch (e) {
                        //console.log(e);
                    }
                    break;
                }
            }
            setItems(itemsAux);
            //items = itemsAux;
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
            passed = false;
            return false;
        })
        /*.finally(() => {
            setLoading(false);
        });*/
    }

    const codeFind = (text) => {
        if(text.length) {
            //console.log("Hola soy code change "+text);
            let codigo = text.split(',')[0].match(/([A-Z|a-z|0-9])/g);
            findCode(codigo?.join("") || "");
        }
    }

    const findCode = (scancode) => {
        if(!scancode) return;
        console.log("Codigo scaneado: "+scancode);

        // Reseteamos variables para su busqueda y de una vez posicionamos el cursor a que escriba lo mas rapido posible
        inputScan.current?.clear();
        /*setTimeout(() =>
            inputScan.current?.focus()
        ,200);*/
        
        // Primero Buscamos en los items si existe
            
        if(scanSelect && scancode === scanSelect.unidad_index?.EAN11 && mode.mode === 'update') {
            //console.log("Hola es el mismo codigo")
            if(!scanSelect.Producto?.ProdConLotes?.length && autosumar) {
                console.log("Hola es el mismo codigo y sumamos", scanSelect)
                let itemTemp = JSON.parse(JSON.stringify(scanSelect));
                let fullItems = false;
                
                if(scanSelect.noBase) { // No es unidad base
                    if(parseInt(itemTemp.maxQuantity-itemTemp.TCANT) >= parseInt(scanSelect.unidad_index.UMREZ)) {
                        itemTemp.TCANT = parseInt(scanSelect.unidad_index.UMREZ)+parseInt(itemTemp.TCANT);
                    } else {
                        if(itemTemp.TCANT >= parseInt(itemTemp.maxQuantity))
                            fullItems = true;
                        itemTemp.TCANT = parseInt(itemTemp.maxQuantity);
                        RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                        ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                    }
                } else {
                    if(parseInt(itemTemp.maxQuantity-itemTemp.TCANT) > 0) {
                        itemTemp.TCANT = parseInt(itemTemp.TCANT)+1;
                    } else {
                        if(itemTemp.TCANT >= parseInt(itemTemp.maxQuantity))
                            fullItems = true;
                        itemTemp.TCANT = parseInt(itemTemp.maxQuantity);
                        RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                        fullItems = true;
                        ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                    }
                }
                //itemTemp.quantity_usar = parseInt(itemTemp.TCANT).toString();
                RNBeep.beep(true);
                mode = {
                    mode: 'update',
                    lote: null
                }
                //console.log(mode);
                if(!fullItems && autoinsert && itemTemp.TCANT > 0) {
                    setTimeout(() => saveProduct(itemTemp),10);
                }
                setScan(itemTemp);
                cantidadInput1 = itemTemp.TCANT;
                setCant1(cantidadInput1);
                // Sonido de join
            } else if(scanSelect.Producto?.ProdConLotes?.length && autosumar) {
                RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
            }

            //inputScan.current?.focus()
            mode = {
                mode: 'update',
                lote: mode.lote
            }
            return;
        } else { // no es el mismo codigo por ende reseteamos las variables y estados
            setScan({});
            lotes = [];
            setLoteSel(null);
            setCant1("");
            for(let item of items) {
                for(let und of item.Producto?.ProductosUnidads) {
                    const unidadBase = item.Producto.UnidadBase?.MEINS || "ST";
                    //console.log("item: "+und.EAN11, "scan: "+scancode, "Unidad Base: "+item.Producto.UnidadBase?.MEINS)
                    if(und.EAN11 === scancode) {
                        let lotico = [];
                        let fullItems = false;
                        item.TCANT = parseInt(item.TCANT);
                        item.unidad_index = und;

                        if(und.MEINH !== unidadBase) { // No es unidad base
                            item.noBase = true;
                            if(!lotico.length)
                                item.max_paquete = Math.floor(item.maxQuantity/und.UMREZ);
                            else 
                                item.max_paquete = {};
                        } else {
                            item.noBase = false
                        }

                        if(item.Producto.ProdConLotes.length) {
                            item.max_paquete = {};
                        }
                        for(let quan2 of item.Producto.ProdConLotes) {
                            if(item.noBase)
                                item.max_paquete[quan2.CHARG] = Math.floor(item.maxQuantityLote[quan2.CHARG]/und.UMREZ);
                            lotico.push({
                                label: quan2.CHARG,
                                value: quan2.CHARG,
                                subLabel: quan2.LAEDA+" - (Cant. "+item.max_paquete[quan2.CHARG]+")"
                            });
                        }
                        
                        lotes = lotico;
                        if(!lotico.length && autosumar) {
                            if(item.noBase) { // No es unidad base
                                if(parseInt(item.maxQuantity-item.TCANT) >= parseInt(und.UMREZ)) {
                                    item.TCANT = parseInt(und.UMREZ)+parseInt(item.TCANT);
                                } else {
                                    if(item.TCANT >= parseInt(item.maxQuantity))
                                        fullItems = true
                                    item.TCANT = parseInt(item.maxQuantity);
                                    RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                                    ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                                }
                            } else {
                                if(parseInt(item.maxQuantity-item.TCANT) > 0) {
                                    item.TCANT = parseInt(item.TCANT)+1;
                                } else {
                                    if(item.TCANT >= parseInt(item.maxQuantity))
                                        fullItems = true
                                    item.TCANT = parseInt(item.maxQuantity);
                                    RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                                    fullItems = true;
                                    ToastAndroid.show("Has alcanzado la cantidad máxima", ToastAndroid.SHORT);
                                }
                            }
                            //item.quantity_usar = parseInt(item.TCANT).toString();
                            RNBeep.beep(true);
                            // Sonido de join

                            mode = {
                                mode: 'update',
                                lote: null
                            }
                            //console.log(mode);
                            if(!lotico.length && !fullItems && autoinsert && item.TCANT > 0) {
                                setTimeout(() => saveProduct(item), 10);
                            }
                            setCant1(item.TCANT)
                        }
                        if(lotico.length) {
                            item.TCANT = null;
                        }
                        if(lotico.length && autosumar) {
                            RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                        }

                        cantidadInput1 = item.TCANT;
                        mode = {
                            mode: 'update',
                            lote: mode.lote
                        }
                        setScan(item);

                        //inputScan.current?.focus()
                        return;
                    }
                }
            }
        }

        // Si no está entre los items buscamos en la API
        setLoading(true);
        let datos = [
            `fromWERKS=${traslado.FWERK}`,
            `fromLGORT=${traslado.FLGOR}`,
            `code=${scancode}`,
            `trasladoId=${traslado.IDTRA}`,
            'simpleData=true'
        ];
        fetchIvan(props.ipSelect).get('/Scan', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log("Producto", data.data);
            lotes = [];
            let producto = JSON.parse(JSON.stringify(data.data));
            try {
                const unidadBase = producto.Producto.UnidadBase?.MEINS || "ST";
                if(producto.Producto.ProdConLotes.length) {
                    producto.maxQuantityLote = {};
                    if(producto.quantities?.length) {
                        for(let lote of producto.Producto.ProdConLotes) {
                            for(let quan1 of producto.quantities) {
                                if(quan1.CHARG == lote.CHARG) {
                                    producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS)-parseInt(quan1.quantity_used);
                                    //console.log("LOTE "+lote.CHARG+" MAX: "+producto.maxQuantityLote[lote.CHARG]);
                                } else {
                                    if(!producto.maxQuantityLote[lote.CHARG]) {
                                        producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                                        //console.log("LOTE "+lote.CHARG+" MAX: "+producto.maxQuantityLote[lote.CHARG]);
                                    }
                                }
                            }
                        }
                    } else {
                        for(let lote of producto.Producto.ProdConLotes) {
                            producto.maxQuantityLote[lote.CHARG] = parseInt(lote.CLABS);
                        }
                    }
                    for(let unidad of producto.Producto.ProductosUnidads) { 
                        if(unidad.EAN11 === scancode) {
                            producto.unidad_index = unidad;
                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = {};
                                for(let lote of producto.Producto.ProdConLotes) {
                                    producto.max_paquete[lote.CHARG] = Math.floor(producto.maxQuantityLote[lote.CHARG]/unidad.UMREZ);
                                }
                            } else {
                                producto.noBase = false;
                            }
                            break;
                        }
                    }
                } else {
                    let quantity_used = producto.quantities.reduce((prev, q) => parseInt(prev)+parseInt(q.quantity_used),0);
                    producto.maxQuantity = parseInt(producto.Producto.ProdSinLotes[0]?.LABST || 0)-parseInt(quantity_used);

                    for(let unidad of producto.Producto.ProductosUnidads) {
                        if(unidad.EAN11 === scancode) {
                            producto.unidad_index = unidad;
                            if(unidad.MEINH !== unidadBase) { // ST ES UNIDAD
                                producto.noBase = true;
                                producto.max_paquete = Math.floor(producto.maxQuantity/unidad.UMREZ);
                            } else {
                                producto.noBase = false;
                            }
                            break;
                        }
                    }
                }
            } catch (e) {
                //console.log(e);
            }
            if(!producto.maxQuantityLote) { // No es por lote puedo sumar de una
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
                if(autosumar)
                    RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
            }
            //console.log("Find Producto", producto);

            for(let quan2 of producto.Producto.ProdConLotes) {
                lotes.push({
                    label: quan2.CHARG,
                    value: quan2.CHARG,
                    subLabel: quan2.LAEDA+" - (Cant. "+producto.maxQuantityLote[quan2.CHARG]+")"
                });
            }
            //setLotes(lotes);

            /*setMode({
                mode: 'insert',
                lote: null
            });*/
            cantidadInput1 = producto.TCANT;
            
            //setCant1(cantidadInput1);
            mode = {
                mode: 'insert',
                lote: null
            }
            setScan(producto);

            if(!lotes.length && autoinsert && producto.TCANT > 0) {

                //console.log("INSERTAMOS??")
                setTimeout((prod = producto) => saveProduct(prod), 10);
            }
        })
        .catch(({status, error}) => {
            
            console.log(error);
            RNBeep.beep(false);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
            inputScan.current?.focus();
        });
    }

    const changeQuantity = (cantidad) => {
        if(scanSelect.maxQuantityLote && !loteSel) return;
        //console.log("Change quantity: "+cantidad)
        let cant = ''
        try {
            cant = cantidad.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }
        if(!cant) {
            //return setScan({...scanSelect, TCANT: cant})
            setCant1(cant);
            return inputCant1.current?.setNativeProps({text: cant});
        }
        if(scanSelect.maxQuantityLote) {
            if(parseInt(cant) <= scanSelect.maxQuantityLote[loteSel]) {
                //setScan({...scanSelect, TCANT: cant})
                setCant1(cant);
                return inputCant1.current?.setNativeProps({text: cant});
            } else {
                setCant1(scanSelect.maxQuantityLote[loteSel].toString());
                //setScan({...scanSelect, TCANT: scanSelect.maxQuantityLote[loteSel].toString()})
                return inputCant1.current?.setNativeProps({text: scanSelect.maxQuantityLote[loteSel].toString()});
            }
        } else {
            if(parseInt(cant) <= scanSelect.maxQuantity) {
                //setScan({...scanSelect, TCANT: cant})
                setCant1(cant);
                return inputCant1.current?.setNativeProps({text: cant});
            } else {
                setCant1(scanSelect.maxQuantity.toString());
                return inputCant1.current?.setNativeProps({text: scanSelect.maxQuantity.toString()});
                //setScan({...scanSelect, TCANT: scanSelect.maxQuantity.toString()})
            }
        }
    }

    const changeQuantityPost = (text) => {
        console.log("Hola soy change cantidad ",text);
        if(!text) {
            return inputCant1.current?.setNativeProps({text: cantidadInput1});
        }
        cantidadInput1 = text;
        //setScan({...scanSelect, TCANT: parseInt(text)})
    }

    const changeQuantity2 = (item, cantidad) => {
        let cant = '0'
        try {
            cant = cantidad.match(/^[0-9]*$/g)[0];
        } catch {
        }
        if(!cant) {
            //item.quantity_usar = cant;
            otroInput.current?.setNativeProps({text: cant});
        } else {
            if(item.maxQuantityLote) {
                if(parseInt(cant) <= item.maxQuantityLote[item.CHARG]) {
                    //item.quantity_usar = cant;
                    otroInput.current?.setNativeProps({text: cant});
                } else {
                    //item.quantity_usar = item.maxQuantityLote[item.CHARG].toString();
                    otroInput.current?.setNativeProps({text: item.maxQuantityLote[item.CHARG].toString()});
                }
            } else {
                if(parseInt(cant) <= item.maxQuantity) {
                    //item.quantity_usar = cant;
                    otroInput.current?.setNativeProps({text: cant});
                } else {
                    //item.quantity_usar = item.maxQuantity.toString();
                    otroInput.current?.setNativeProps({text: item.maxQuantity.toString()});
                }
            }
        }
        //let prod = JSON.parse(JSON.stringify(items));
        //setItems(prod);
        //items = prod;
    }

    const saveProduct = (producto = {}, cantidad = false) => {
        //console.log(mode, loteSel, producto);
        //console.log("Cantidad Input = "+cantidadInput1, producto.TCANT, producto.quantity_usar, cantidad)

        if(cantidad && cantidadInput1)  // llamado desde el boton
            producto.TCANT = parseInt(cantidadInput1);
        else if(cantidad && !cantidadInput1) {
            console.log("aqui")
            RNBeep.beep(false);
            return ToastAndroid.show(
                "Por favor establece una cantidad y/o lote válido",
                ToastAndroid.SHORT
            );
        }
        
        //console.log("Cantidad Input = "+cantidadInput1, producto.TCANT, producto.quantity_usar, cantidad)

        if(!producto.TCANT || producto.TCANT <= 0 || (producto.maxQuantityLote && (!loteSel || producto.TCANT > producto.maxQuantityLote[loteSel]))) {
            RNBeep.beep(false);
            return ToastAndroid.show(
                "Por favor establece una cantidad y/o lote válido",
                ToastAndroid.SHORT
            );
        }
        console.log(cantidad, producto.TCANT, producto.quantity_usar, mode)   
        if(cantidad && producto.TCANT == producto.quantity_usar && cantidadInput1 == producto.quantity_usar && mode.mode === 'update') {
            console.log(cantidad, producto.TCANT, producto.quantity_usar, mode, cantidadInput1)   
            return;
        }

        let datos = {};

        setLoadingSave(true);
        //console.log(mode, loteSel);
        if(mode.mode === 'update') {
            datos.id = producto.IDTRI;
            datos.update = {
                TCANT: parseInt(producto.TCANT)
            }
            //console.log(producto, datos);
            fetchIvan(props.ipSelect).put('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Productos actualizado: ", data.data);
                let prod = JSON.parse(JSON.stringify(items));
                for(let i=0;i < prod.length;i++) {
                    if(prod[i].IDTRI == producto.IDTRI) {
                        let aux = {...producto, ...datos.update};
                        aux.quantity_usar = producto.TCANT.toString();
                        prod[i] = JSON.parse(JSON.stringify(aux));
                        //console.log("SetprodU1", prod[i]);
                        if(cantidad) // llamado desde el boton
                            setScan(prod[i]);
                        break;
                    }
                }
                setItems(prod);
                //items = prod;
                //setTimeout(() => checkProduct(producto.MATNR, producto.IDTRI, parseInt(producto.TCANT)),10); // CONSULTAMOS LAS CANTIDADES EN VIVO AL ACTUALIZAR CUIDADO CON ESTO PUEDE RALENTIZAR LA APP
                
                ToastAndroid.show(
                    "Cantidad actualizada con éxito",
                    ToastAndroid.SHORT
                );
            })
            .catch(({status, error}) => {
                //console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScan({});
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
        } else if(mode.mode === 'insert') {
            datos.create = {
                IDTRA: traslado.IDTRA,
                MATNR: producto.Producto.MATNR,
                MAKTG: producto.Producto.MAKTG,
                MEINH: producto.Producto.UnidadBase.MEINS,
                TCANT: parseInt(producto.TCANT),
                //CHARG: producto.CHARG,
                //LGORT: traslado.FLGOR
            }
            if(mode.lote) {
                datos.create.CHARG = mode.lote;
            }
            //console.log(producto, datos);
            fetchIvan(props.ipSelect).post('/crudTrasladoItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Producto insertado", data.data);
                producto.quantity_usar = producto.TCANT.toString();
                setItems([{...producto, ...data.data}, ...items]);
                //items = [{...producto, ...data.data}, ...items];
                setScan({...producto, ...data.data});
                console.log(data.data, {...producto, ...data.data});

                /*setMode({
                    mode: 'update',
                    lote: mode.lote,
                    noPush: true
                });*/
                mode = {
                    mode: 'update',
                    lote: mode.lote
                }
                //setTimeout(() => checkProduct(data.data.MATNR, data.data.IDTRI, parseInt(data.data.TCANT)),10); // CONSULTAMOS LAS CANTIDADES EN VIVO AL ACTUALIZAR CUIDADO CON ESTO PUEDE RALENTIZAR LA APP
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
                if(error.text?.indexOf("Validation error") !== -1 || error.text?.indexOf("No reconozco ese ID") !== -1) {
                    setScan({});
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
            setLoadingSave(false);
        }
    }

    const updateProduct = (item, cantidad) => {
        if(!cantidad) {
            return otroInput.current?.setNativeProps({text: item.quantity_usar});
        }
        item.quantity_usar = cantidad;
        if(item.TCANT == item.quantity_usar || !item.quantity_usar) return;
        //if(!cantidad || item.TCANT == item.quantity_usar) return;

        if((item.maxQuantityLote && item.quantity_usar > item.maxQuantityLote[item.CHARG]) || item.quantity_usar > item.maxQuantity || item.quantity_usar <= 0) {
            return ToastAndroid.show(
                "Por favor establece una cantidad válida",
                ToastAndroid.SHORT
            );
        }

        let datos = {
            id: item.IDTRI,
            update: {
                TCANT: parseInt(item.quantity_usar)
            }
        }
        setLoadingSave(true);
        console.log(datos);
        fetchIvan(props.ipSelect).put('/crudTrasladoItems', datos, props.token.token)
        .then(({data}) => {
            //console.log("Productos actualizados: ", data.data);
            let prod = JSON.parse(JSON.stringify(items));
            for(let i=0;i < prod.length;i++) {
                if(prod[i].IDTRI == item.IDTRI) {
                    prod[i].TCANT = parseInt(cantidad);
                    prod[i].quantity_usar = cantidad;
                    //console.log(prod[i].IDTRI, scanSelect.IDTRI, prod[i].CHARG)

                    if(prod[i].IDTRI == scanSelect.IDTRI && ((prod[i].CHARG && prod[i].CHARG == mode.lote) || !prod[i].CHARG)) {
                        inputCant1.current?.setNativeProps({text: cantidad});
                        cantidadInput1 = cantidad;
                        setCant1(cantidad);
                    }
                    //console.log("SetprodUpdate", prod[i]);
                    break;
                }
            }
            setItems(prod);
            //otroInput.current?.setNativeProps({text: cantidad});
            //items = prod;
            //setScan({});
            //checkProduct(item.MATNR, item.IDTRI, cantidad);// CONSULTAMOS LAS CANTIDADES EN VIVO AL ACTUALIZAR CUIDADO CON ESTO PUEDE RALENTIZAR LA APP
            //setTimeout(() => checkProduct(item.MATNR, item.IDTRI, parseInt(item.quantity_usar)),10); // CONSULTAMOS LAS CANTIDADES EN VIVO AL ACTUALIZAR CUIDADO CON ESTO PUEDE RALENTIZAR LA APP

            ToastAndroid.show(
                "Cantidad actualizada con éxito",
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

                //inputScan.current?.focus()
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
            setLoadingSave(false);
        });
    }

    const deleteItem = (name, id) => {
        //console.log("Delete items")
        
        Alert.alert('Confirmar', `¿Deseas eliminar el ítem (${name}) realmente?`, [
            {
              text: 'Si deseo eliminar',
              style: 'destructive',
              onPress: () => {
                let datos = {
                    id: id
                };
                setLoading(true);
                
                fetchIvan(props.ipSelect).delete('/crudTrasladoItems', datos, props.token.token)
                .then(({data}) => {
                    console.log("Productos borrados: ", data.data);
                    setItems(items.filter(f => f.IDTRI !== id));
                    //items = items.filter(f => f.IDTRI !== id);
                    if(scanSelect.IDTRI == id) {
                        /*setMode({
                            mode: 'insert',
                            lote: null,
                            noPush: true
                        })*/
                        //cantidadInput1 = 0;
                        mode = {
                            mode: 'insert',
                            lote: mode.lote
                        };
                    }
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

    const finalizarTraslado = async () => {
        Alert.alert('Confirmar', `Antes de finalizar la carga de traslado por favor verifica los artículos en la lista con su cantidad.`, [
            {
                text: 'Confirmar',
                style: 'destructive',
                onPress: async () => {
                    getItems(true) // Chequeo de items antes de cerrar
                    .then(filtro => {
                        if(!filtro)
                            return ToastAndroid.show("Error finalizando el traslado por favor verifique las cantidades nuevamente", ToastAndroid.LONG);
                        
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
                    })
                },
            },
            {
            text: 'Cancelar',
            style: 'cancel',
            }
        ]);
    } 

    const DialogoInfo = () => 
        <Dialog visible={showInfo} onDismiss={() => setShowInfo(false)}>
            <DialogHeader title={traslado.TRCON}/>
            <DialogContent>
                <HStack spacing={4}>
                    <Text style={styles.title2}>Creado Por:</Text>
                    <Text style={styles.subtitle}>{`${traslado.CreadoPor?.USNAM||""} ${traslado.CreadoPor?.USLAS||""}`}</Text>
                </HStack>
                {traslado.ActualizadoPor ? <HStack spacing={4}>
                    <Text style={styles.title2}>Actualizado Por:</Text>
                    <Text style={styles.subtitle}>{`${traslado.ActualizadoPor?.USNAM||""} ${traslado.ActualizadoPor?.USLAS||""}`}</Text>
                </HStack>:''}
                <HStack spacing={4}>
                    <Text style={styles.title2}>Fecha:</Text>
                    <Text style={styles.subtitle}>{traslado.TRACR.split("T")[0]+" "+traslado.TRACR.split("T")[1].substring(0,5)}</Text>
                </HStack>
                <HStack spacing={4}>
                    <Text style={styles.title2}>Origen:</Text>
                    <Text style={styles.subtitle}>{traslado.DesdeCentro?.NAME1}{"\n"}({traslado.DesdeCentro?.Almacenes[0]?.LGOBE})</Text>
                </HStack>
                <HStack spacing={4}>
                    <Text style={styles.title2}>Destino:</Text>
                    <Text style={styles.subtitle}>{traslado.HaciaCentro?.NAME1}{"\n"}({traslado.HaciaCentro?.Almacenes[0]?.LGOBE})</Text>
                </HStack>
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

    const RowProducts = (item, index) => 
        <HStack
            key={index}
            spacing={4}
            style={[styles.items,(scanSelect.Producto?.MATNR === item.MATNR ? {backgroundColor: 'lightgreen'}:{}), {width: '100%'}]}
        >
            <VStack w="55%">
                <Text style={styles.title2}>{item.MAKTG || item.Producto.MAKTG || ""}</Text>
                <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]}>{item.unidad_index?.EAN11 || item.MATNR}</Text>
                {item.CHARG && traslado.TRSTS === 1 && <Text style={styles.subtitle} color="primary">Lote: {item.CHARG}</Text>}
            </VStack>

            {traslado.TRSTS === 1 ? <VStack w="25%" style={{alignSelf: 'flex-end'}}>
                <Text style={[styles.small2,((item.maxQuantityLote && item.quantity_usar > item.maxQuantityLote[item.CHARG]) 
                                                || (!item.maxQuantityLote && item.quantity_usar > item.maxQuantity)) ? {color: 'red'}:{}]}>
                    Max: {item.maxQuantityLote ? item.maxQuantityLote[item.CHARG]:item.maxQuantity}
                </Text>
                <TextInput
                    containerStyle={{fontSize: 5, padding: 0}} 
                    value={item.quantity_usar} 
                    numeric
                    textAlign={'center'}
                    onChangeText={(text) => changeQuantity2(item, text)} 
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 75,
                        height: 45
                    }}
                    inputStyle={((item.maxQuantityLote && item.quantity_usar > item.maxQuantityLote[item.CHARG]) 
                        || (!item.maxQuantityLote && item.quantity_usar > item.maxQuantity)) ? {color: 'red'}:{}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    //onBlur={(e) => updateProduct(item) }
                    onEndEditing={(e) => updateProduct(item, e.nativeEvent.text) }
                    ref={otroInput}
                    maxLength={10}
                    />
                {/* <Text style={styles.subtitle}>{getCantUnidades(item)}</Text> */}
            </VStack>:
            <VStack w="30%">
                <Text style={styles.subtitle}>Cantidad:</Text>
                <Text style={styles.quantity}>{parseInt(item.TCANT)}</Text>
                {item.CHARG && <Text style={styles.subtitle}>Lote:</Text> }
                {item.CHARG && <Text style={styles.lote}>{item.CHARG}</Text>}
                {/* <Text style={styles.subtitle}>{getCantUnidades(item)}</Text> */}
            </VStack>}
            {traslado.TRSTS === 1 && 
                <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => deleteItem(item.MAKTG, item.IDTRI)} style={{alignSelf: 'center'}}/>
            }
        </HStack>
    ;

    const memoRows = useCallback((item, index) => RowProducts(item, index), [items, scanSelect.Producto ? scanSelect.Producto.MATNR:undefined, loadingSave, traslado])

    const memoGet = useCallback((force = false) => getItems(force));

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
        let cantidad = parseInt(cant1 || producto.TCANT);
        console.log(cantidad, producto.unidad_index)
        let paquete = Math.floor(cantidad/producto.unidad_index.UMREZ);
        let unidad = cantidad - (paquete*producto.unidad_index.UMREZ);
        if(!cantidad) return "";

        if(producto.noBase) {
            return (paquete == 0 || paquete > 1 ? getPrural(producto.unidad_index.UnidadDescripcion.MSEHL):producto.unidad_index.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
                +(unidad == 0 || unidad > 1 ? getPrural(producto.Producto.UnidadBase.UnidadDescripcion.MSEHL):producto.Producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
        }
        return (cantidad == 0 || cantidad > 1 ? getPrural(producto.Producto.UnidadBase.UnidadDescripcion.MSEHL):producto.Producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
    }
    
    //const memoRows = useMemo((item, index) => RowProducts(item, index),[items])
    return (
        <Provider>
            <Stack spacing={0} m={2} mb={-4}>
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                <ScrollView ref={scrollShow} nestedScrollEnabled = {true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> memoGet(true)}/>}>
                    
                    <DialogoInfo/>

                    <Text style={[styles.subtitle, {alignSelf: 'flex-end'}]} onPress={() => setShowInfo(!showInfo)}><Entypo name="info-with-circle" size={16} color={Global.colorMundoTotal}/> Info Traslado</Text>
                    
                    <Text style={[styles.title1, {marginTop: 0}]}>{Global.displayName}</Text>

                    {traslado.TRSTS === 1 ? 
                        <View> 
                            <VStack spacing={-8}>
                                <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                                    //value={scancode}
                                    //autoFocus = {true} 
                                    //onChangeText={codeFind} 
                                    onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                                    //onBlur={(e) => codeFind(e.nativeEvent.text) }
                                    showSoftInputOnFocus={showKeyBoard}
                                    keyboardType={!showKeyBoard ? "numeric":"default"}
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
                                {scanSelect && scanSelect.Producto ? 
                                <Stack spacing={0}>
                                    <ImagesAsync ipSelect={props.ipSelect}  imageCode={scanSelect.Producto.MATNR} token={props.token.token}/>
                                    <HStack spacing={4}>
                                        <Text style={styles.title2}>Código:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.unidad_index?.EAN11}</Text>
                                    </HStack>
                                    <HStack spacing={4}>
                                        <Text style={styles.title2}>Unidad de escaneo:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.unidad_index?.UnidadDescripcion?.MSEHL || ""}</Text>
                                        {scanSelect.noBase && <Text style={styles.small2}>({scanSelect.maxQuantityLote ? (loteSel && scanSelect.max_paquete[loteSel]):scanSelect.max_paquete} completos)</Text>}
                                    </HStack>
                                    {scanSelect.noBase && <Text style={styles.small2}>{parseInt(scanSelect.unidad_index.UMREZ)+" "+scanSelect.Producto.UnidadBase?.UnidadDescripcion?.MSEHL+". Por "+(scanSelect.unidad_index?.UnidadDescripcion?.MSEHL || "")}</Text>}
                                    <HStack spacing={4} style={{width: '80%', flexWrap: 'nowrap'}}>
                                        <Text style={styles.title2}>Producto:</Text>
                                        <Text style={styles.subtitle}>{scanSelect.Producto.MAKTG}</Text>
                                    </HStack>
                                    <Text style={styles.subtitle}>{scanSelect.Producto.MATNR}</Text>

                                    {(lotes.length && loteSel) || !lotes.length ? <VStack style={{justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                                        <Text style={styles.title1}>{getCantUnidades(scanSelect)}</Text>
                                    </VStack>:''
                                    }
                                    <HStack spacing={5} mt={0} style={{justifyContent: 'space-between'}}>
                                        {lotes.length && <VStack style={{ alignSelf: 'center'}}>
                                                <Text style={[styles.small2, {fontWeight: 'bold'}]}>Lotes:</Text>
                                                <VirtualList
                                                searchable={true}
                                                data={lotes}
                                                value={loteSel}
                                                setValue={setLoteSel}
                                                title="Lotes"
                                                buttonStyle={{minWidth: 120}}
                                            />
                                        </VStack>}
                                        <VStack mt={-4} spacing={4} style={{justifyContent: 'flex-end'}}>
                                            <HStack m={0} mt={lotes.length ? -20:1} spacing={1} style={{alignItems: 'flex-end', width: 'auto', maxWidth: lotes.length ? '50%':'90%', flexWrap: 'nowrap'}}>
                                                <Text style={styles.small2}>Cant. Disp:</Text>
                                                <Text style={styles.title2}>{scanSelect.maxQuantityLote ? (loteSel && scanSelect.maxQuantityLote[loteSel]):scanSelect.maxQuantity}</Text>
                                            </HStack>
                                            <TextInput
                                                ref={inputCant1}
                                                value={scanSelect.TCANT?.toString()} 
                                                onChangeText={(text) => changeQuantity(text)} 
                                                onEndEditing={(e) => changeQuantityPost(e.nativeEvent.text)}
                                                numeric
                                                keyboardType="numeric"
                                                editable={((loteSel && scanSelect.maxQuantityLote[loteSel] > 0) || scanSelect.maxQuantity > 0) ? true:false}
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
                                        onPress={() => saveProduct(JSON.parse(JSON.stringify(scanSelect)), true)} 
                                        disabled={loadingSave}/>
                                </Stack>:''}
                            </Box>
                        </View>
                    : '' }
                    {loading ? <ActivityIndicator />:''}
                    <Stack style={styles.escaneados}>
                        <HStack spacing={2} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={styles.title2}>Productos escaneados ({items.length}):</Text>
                            {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && traslado.TRSTS === 1 && items.length && <Button compact={true} title="Finalizar" onPress={finalizarTraslado} disabled={loading || loadingSave} loading={loading || loadingSave}/>}
                        </HStack>
                        <ListaPerform 
                            items={items} 
                            renderItems={memoRows} 
                            heightRemove={traslado.TRSTS === 1 ? ((scanSelect && scanSelect.Producto ) ? 125:280):160}
                            //refreshGet={memoGet}
                            />
                    </Stack>
                    <View style={{ width: 200, height: 10 }}></View>
                </ScrollView>
            </Stack>
        </Provider>
    )
}

export default Scaneo;


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
    }
});