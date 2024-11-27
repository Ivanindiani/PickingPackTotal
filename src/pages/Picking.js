import { ActivityIndicator, Box, Button, Chip, Dialog, DialogContent, Divider, HStack, IconButton, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, StyleSheet, ToastAndroid, View } from "react-native";
import SelectInput from "../components/_virtualSelect";
import { ScrollView } from "react-native";
import { Alert } from "react-native";
import fetchIvan from "../components/_fetch";
import ImagesAsync from "../components/_imagesAsync";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ListaPerform from "../components/_virtualList";

import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
import Ft from "react-native-vector-icons/Fontisto";
import RNBeep from "react-native-a-beep";
import KeyEvent from 'react-native-keyevent';

const Global = require('../../app.json');

var mode = {};
const ManagerProducts = (props) => {
    const centroId = props.route.params.centroId;
    const almacenId = props.route.params.almacenId;
    const [recepcion, setRecepcion] = useState(props.route.params.recepcion);
    
    const [dialogVisible, setDialogVisible] = useState(-1);
    const [lote, setLote] = useState(null);
    const [preProduct, setPreProduct] = useState({});
    const [productos, setProductos] = useState([]);
    const [cantidad, setCantidad] = useState(0);

    const [undSelect, setUndSelect] = useState(null);

    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [autosumar, setAutoSumar] = useState(true);
    const [autoinsert, setAutoInsert] = useState(false);

    const [loading, setLoading] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [dateLote, setDateLote] = useState(null);
    const [loteName, setLoteName] = useState(null);
    const [cuatro, setCuatro] = useState(null);

    const inputScan = useRef(null);
    const inputCantidad = useRef(null);
    const otroInput1 = useRef([]);
    const otroInput2 = useRef([]);
    const otroInput3 = useRef(null);
    const otroInput4 = useRef(null);
    const scrollShow = useRef(null);

    useEffect(() => {
        if(loading) {
            setMsgConex("");
        }
    }, [loading === true]);

    useEffect(() => {
        getProductos();
    }, []);

    useEffect(() => {
        if(recepcion.RESTS === 'CREADO' && dialogVisible === -1) {
            //console.log("Mount listerner key")
            KeyEvent.onKeyDownListener(evento);

            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        }
    },[dialogVisible, recepcion]); 

    /*useEffect(() => {
        if(dialogVisible > -1) {
            otroInput3.current?.setNativeProps({text: productos[dialogVisible].QUAND?.toString() ?? '0'});
            otroInput4.current?.setNativeProps({text: productos[dialogVisible].COMEN});
        }
    }, [dialogVisible]);*/
    
    // Evento alternativo para detectar el escaneo
    const evento = (keyEvent) => { 
        /*if(keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) { // Nos llaman con enter
            //if(verItems)
                setVerItems(false);
        }*/
        console.log(`Key: ${keyEvent.pressedKey}`);
        console.log(`onKeyUp keyCode: ${keyEvent.keyCode}`);
        //console.log("FOCUS?",otroInput.current?.isFocused());
        try {
            if(!inputScan.current?.isFocused()){ // && !otroInput1.current?.isFocused() && !otroInput2.current?.isFocused() && !inputCantidad.current?.isFocused()) {
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
        } catch(e) {
            console.log(e);
        }
    }

    useEffect(() => {// Efecto para detectar si va para atras
        if(recepcion?.RESTS === 'CREADO') {
            let before = props.navigation.addListener('beforeRemove', (e) => {
                if(dialogVisible !== -1) {
                    setDialogVisible(-1)
                    return e.preventDefault();
                }
                //console.log("Mount listener info")
                e.preventDefault();
                Alert.alert('Escaneo de productos', '¿Deseas realmente salir de la ventana de escaneo de productos?',
                [{
                    text: 'No', style: 'cancel'
                },{
                    text: 'Si', style: 'destructive', onPress: () => props.navigation.dispatch(e.data.action)
                }])
            });

            return () => {
                //console.log("Remove listener info");
                before();
            }
        }
    }, [props.navigation, dialogVisible, recepcion?.RESTS]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        setTimeout(() => {
            inputScan.current?.focus();
        }, 100);
    },[showKeyBoard, autosumar, autoinsert, preProduct]);

    useEffect(() => {
        setCantidad(0);
        setLoteName(null);
        setCuatro(null);
        if(lote) {
            let encontrar = false;
            inputCantidad.current?.setNativeProps({text: ""})
            for(let item of productos) {
                if(item.LOTEA == lote) {
                    //console.log("Encontramos el lote en la lista: ", item.quantity_usar)
                    encontrar = true;
                    inputCantidad.current?.setNativeProps({text: item.QUANT.toString()})
                    setCantidad(item.QUANT);
                    //setPreProduct(item);
                    break;
                }
            }
            mode = {
                mode: encontrar ? 'update':'insert', 
                lote: lote
            };
        } else {
            mode = {mode: mode.mode, lote: lote};
        }
    }, [lote]);

    useEffect(() => {
        if(loteName) {
            let encontrar = false;
            //inputCantidad.current?.setNativeProps({text: ""});
            //setCantidad(0);
            for(let item of productos) {
                if(item.LOTEA == loteName) {
                    //console.log("Encontramos el lote en la lista: ", item.quantity_usar)
                    encontrar = true;
                    inputCantidad.current?.setNativeProps({text: item.QUANT.toString()})
                    setCantidad(item.QUANT);
                    //setPreProduct(item);
                    break;
                }
            }
            mode = {
                mode: encontrar ? 'update':'insert', 
                lote: loteName
            };
        } else {
            mode = {mode: mode.mode, lote: loteName};
        }
    }, [loteName]);

    async function getProductos() {
        return new Promise((resolve, reject) =>{
            let datos = [
                `IDREC=${recepcion.IDREC}`,
                `find={"IDREC": "${recepcion.IDREC}"}`,
                `orderBy=[["DATEC", "DESC"]]`,
                `simpletData=true`
            ];
            setLoading(true);
            fetchIvan(props.ipSelect).get('/administrative/crudRecepcionItems', datos.join('&'), props.token.token)
            .then(({data}) => {
                let prods = data.data;
                for(let i=0;i < prods.length;i++) {
                    prods[i].unidad_index = prods[i].UnidadBase;
                    prods[i].noBase = false;
                }
                console.log(prods);
                setProductos(prods);
                resolve(prods);
            })
            .catch(({status, error}) => {
                console.log(status, error);
                reject(error);
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.LONG
                );
            })
            .finally(() => {
                setLoading(false);
            });
        });
    }

    const findCode = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        console.log("hola")
        if(codigo) {
            inputScan.current?.clear();

            let unidadFindScan = {};
            if(preProduct) {
                unidadFindScan = preProduct.ProductosUnidads?.filter((p) => p.EAN11 == codigo)[0] ?? {};
                console.log(unidadFindScan);
            }
            if(preProduct && unidadFindScan.EAN11) {
                if(preProduct.UnidadBase.XCHPF !== 'X' && autosumar) {
                //if(autosumar) {
                    let prod = JSON.parse(JSON.stringify(preProduct));

                    console.log("ENTRAMOS EN PREPRODUCT", mode)
                    let unidad_index = prod.ProductosUnidads?.filter((p) => p.MEINH === undSelect)[0] ?? prod.unidad_index;
                    prod.QUANT = parseInt(prod.QUANT ?? 0)+parseInt(unidad_index.UMREZ);
                    setCantidad(prod.QUANT);
                    if(!inputCantidad.current) {
                        let recursivo = () => {
                            if(!inputCantidad.current){
                                setTimeout(() => recursivo(),100);
                            } else {
                                inputCantidad.current?.setNativeProps({ text: prod.QUANT.toString() ?? '' })
                            }
                        }
                        setTimeout(() => recursivo(),100);
                    } else {
                        inputCantidad.current?.setNativeProps({ text: prod.QUANT.toString() ?? '' });
                    }
                    RNBeep.beep(true);

                    if(prod.IDREA) {
                        mode = {
                            mode: 'update',
                            lote: null
                        }
                    } else {
                        mode = {
                            mode: 'insert',
                            lote: null
                        }
                    }

                    setPreProduct(prod);
                    if(autoinsert && prod.IDREA) {
                        updateProduct(prod, prod.QUANT);
                    } else if(autoinsert && !prod.IDREA) {
                        addProduct(prod);
                    }
                }
                else if(preProduct.UnidadBase.XCHPF === 'X' && autosumar) {
                    RNBeep.PlaySysSound(RNBeep.AndroidSoundIDs.TONE_CDMA_PIP);
                }
                if(preProduct.IDREA) {
                    mode = {
                        mode: 'update',
                        lote: null
                    }
                } else {
                    mode = {
                        mode: 'insert',
                        lote: null
                    }
                }
                return;
            } else {
                setPreProduct({});
                setLote(null);
                setLoteName(null);
                setDateLote(null);
                setUndSelect(null);
                setCantidad(1);
                console.log("Lo buscamos en la lista");
                for(let prod of productos) {
                    const unidadBase = prod.UnidadBase?.MEINS || "ST";
                    for(let und of prod.Producto.ProductosUnidads) {
                        if(und.EAN11 == codigo && prod.UCRID == props.dataUser.IDUSR) { // AHORA ES POR ID DE USUARIO
                            if(prod.UnidadBase.XCHPF === 'X') {
                                mode = {
                                    mode: 'update',
                                    lote: mode.lote
                                }
                                break;
                            }
                            console.log("Lo encontramos en la lista")
                            prod.unidad_index = und;
                            setUndSelect(und.MEINH);

                            if(prod.unidad_index?.EAN11 === prod.UnidadBase.EAN11) {
                                prod.noBase = false;
                            } else {
                                prod.noBase = true;
                            }
                            
                            if(autosumar) {
                                prod.QUANT += parseInt(und.UMREZ);
                                RNBeep.beep(true);
                            }
                            setCantidad(prod.QUANT);
                            if(!inputCantidad.current) {
                                setTimeout(() => inputCantidad.current.setNativeProps({ text: prod.QUANT.toString() ?? '' }),300);
                            } else {
                                inputCantidad.current.setNativeProps({ text: prod.QUANT.toString() ?? '' });
                            }
                            mode = {
                                mode: 'update',
                                lote: null
                            }

                            setPreProduct({...prod, ...prod.Producto});
                            if(autoinsert && autosumar) {
                                updateProduct(prod, prod.QUANT);
                            }
                            return;
                        }
                    }
                }
            
                setLoading(true);
                
                let datos = [
                    `code=${codigo}`,
                    `WERKS=${centroId}`,
                    `LGORT=${almacenId}`,
                    `simpleData=true`,
                    `RECEPCION=true`
                ];
                fetchIvan(props.ipSelect).get('/administrative/findProductScan', datos.join('&'), props.token.token)
                .then(({data}) => {
                    console.log(data);
                    let prod = data.data;
                    
                    mode = {
                        mode: 'insert',
                        lote: null
                    }

                    for(let p in prod.ProductosUnidads) {
                        if(prod.ProductosUnidads[p].EAN11 == codigo) {
                            prod.unidad_index = prod.ProductosUnidads[p];
                            break;
                        }
                    }
                    if(prod.unidad_index?.EAN11 === prod.UnidadBase.EAN11) {
                        prod.noBase = false;
                    } else {
                        prod.noBase = true;
                    }
                    setUndSelect(prod.unidad_index.MEINH);

                    console.log("END FIND", prod);

                    if(prod.UnidadBase.XCHPF !== 'X') {
                        prod.QUANT = 0;
                        if(autosumar) {
                            setCantidad(parseInt(prod.unidad_index.UMREZ));
                            prod.QUANT = parseInt(prod.unidad_index.UMREZ);
                        }
                        let recursivo = () => {
                            if(!inputCantidad.current){
                                setTimeout(() => recursivo(),100);
                            } else {
                                inputCantidad.current?.setNativeProps({ text: prod.QUANT.toString() ?? '' })
                            }
                        }
                        setTimeout(() => recursivo(),50);
                        
                        setPreProduct(prod);
                        if(autoinsert && autosumar) {
                            addProduct(prod);
                        }
                    } else {
                        setPreProduct(prod);
                    }
                }).catch(({status, error}) => {
                    console.log(status, error);
                    if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                        setMsgConex("¡Ups! Parece que no hay conexión a internet");
                    }
                    RNBeep.beep(false);
                    return ToastAndroid.show(
                        error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                        ToastAndroid.LONG
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            }
        }
    }

    const addProduct = (producto = preProduct) => {
        setLoading(true);
        let datos = {
                IDREC: recepcion.IDREC,
            create: {
                IDREC: recepcion.IDREC,
                MATNR: producto.MATNR,
                QUANT: producto.UnidadBase?.XCHPF === 'X' ? cantidad:producto.QUANT
            }
        };
        if(producto.UnidadBase?.XCHPF === 'X') {
            datos.create.LOTEA = lote === 'NEWLOTE' ? loteName:lote;
            datos.create.FVENC = dateLote;
        }
        fetchIvan(props.ipSelect).post('/administrative/crudRecepcionItems', datos, props.token.token)
        .then(({data}) => {
            mode = {
                mode: 'update',
                lote: mode.lote
            }
            data.data.CreadoPor = {
                IDUSR: props.dataUser.IDUSR,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor =  data.data.CreadoPor;
            console.log(data.data);
            setProductos([{Producto: producto, ...producto, ...data.data}, ...productos]);
            setPreProduct({...producto, ...data.data});

        }).catch(({status, error}) => {
            console.log(error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.LONG
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    const changeQuantityPost = (text) => {
        console.log("Hola soy change cantidad ",text);
        
        let cant = '';
        try {
            cant = text.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }

        if(!cant) {
            setCantidad(0);
            return inputCantidad.current?.setNativeProps({text: ""});
        }
        setCantidad(parseInt(cant));
    }

    const getCantUnidades = (producto, cant = cantidad) => {
        if(!cant) return "";
        let unidad_index = producto.ProductosUnidads?.filter((p) => p.MEINH === undSelect)[0] ?? producto.unidad_index;
        console.log(unidad_index);

        let paquete = Math.floor(cant/unidad_index.UMREZ);
        let unidad = (cant - (paquete*unidad_index.UMREZ));
    
        if(producto.noBase) {
            return (paquete == 0 || paquete > 1 ? getPrural(unidad_index?.UnidadDescripcion.MSEHL):unidad_index?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
                +(unidad == 0 || unidad > 1 ? getPrural(producto.UnidadBase?.UnidadDescripcion.MSEHL):producto.UnidadBase?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
        }
        return (cant == 0 || cant > 1 ? getPrural(producto.UnidadBase?.UnidadDescripcion.MSEHL):producto.UnidadBase?.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
    }

    const selectDate = (date) => {
        let fecha = date;
        console.log(fecha)
        //let fechaName = fecha.getDate().toString().padStart(2, '0')+""+(fecha.getMonth()+1).toString().padStart(2, '0')+fecha.getFullYear().toString().substr(-2);
        fecha = fecha.getFullYear().toString()+""+(fecha.getMonth()+1).toString().padStart(2, '0')+""+fecha.getDate().toString().padStart(2, '0');
        setDatePickerVisibility(false);
        setDateLote(fecha);
        /*let name = preProduct.MATNR.substring(0,2)+""+preProduct.MATNR.substr(-2, 2)+""+fechaName;
        console.log(name);
        for(let m in preProduct.ProdConLotes) {
            if(preProduct.ProdConLotes[m].CHARG === name) {
                return Alert.alert('Error', 'Este lote ya existe, actualiza el lote existente');
            }
        }
        setLoteName(name);*/
        if(cuatro) {
            let fechaName = fecha.substring(6,8)+""+fecha.substring(4,6)+""+fecha.substring(2,4);
            setLoteName(cuatro+fechaName);
        }
    }

    const setInputCuatro = (text) => {
        if(text.length != 4) {
            return Alert.alert('Error', 'Selecciona un nombre de 4 carácteres minimo');
        }
        setCuatro(text.toUpperCase());
        if(dateLote) {
            let fechaName = dateLote.substring(6,8)+""+dateLote.substring(4,6)+""+dateLote.substring(2,4);
            setLoteName(text.toUpperCase()+fechaName);
        }
    }

    const finalizarRecepcion = async () => {
        
        Alert.alert('Confirmar', `¿Deseas confirmar la recepción (${recepcion.DESCR}) realmente?`, [
        {
          text: 'Sí, deseo completar',
          style: 'destructive',
          onPress: () => {
            getProductos()
            .then((prods) => {
                //let date = new Date();
                //date = date = parseInt(date.getFullYear().toString().substr(-2)+""+(date.getMonth()+1).toString().padStart(2,"0")+""+date.getDate().toString().padStart(2,"0"));
                
                for(let prod of prods) {
                    /*if(parseFloat(prod.MONTO) < 0.01) {
                        return Alert.alert('Error', 'Hay artículos sin costo por favor verifique');
                    }*/
                    if(parseFloat(prod.QUANT) <= 0) {
                        return Alert.alert('Error', 'Hay artículos con la cantidad inválida  por favor verifique');
                    } 
                    for(let prod2 of prods) {
                        if(prod.MATNR === prod2.MATNR && prod.LOTEA === prod2.LOTEA) {
                            if(prod.MONTO !== prod2.MONTO) {
                                return Alert.alert('Error', 'Hay artículos iguales con monto diferente por favor verifique');
                            }
                        }
                    }
                    /*if(prod.LOTEA) {
                        let fecha_producto = parseInt(prod.LOTEA.substring(8,10)+""+prod.LOTEA.substring(6,8)+""+prod.LOTEA.substring(4,6));
                        console.log(date, fecha_producto, date > fecha_producto);

                        if(date > fecha_producto) {
                            return Alert.alert('Error', 'El articulo '+prod.MATNR+' ya está vencido verifique e intente nuevamente');
                        }
                    }*/
                }
                let datos = {
                    id: recepcion.IDREC,
                    update: {
                        RESTS: 'RECIBIDO'
                    }
                };

                setLoading(true);
                fetchIvan(props.ipSelect).put('/administrative/crudRecepcion', datos, props.token.token)
                .then(({data}) => {
                    console.log("Recepcion confirmada: ", data.data);
                    setPreProduct({});
                    setRecepcion({...recepcion, RESTS: 'RECIBIDO'});
                    props.route.params.updateRecepcion({...recepcion, RESTS: 'RECIBIDO'});
                })
                .catch(({status, error}) => {
                    console.log(error);
                    return ToastAndroid.show(
                        error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                        ToastAndroid.LONG
                    );
                })
                .finally(() => {
                    setLoading(false);
                });
            }).catch((error) => {

            })
          },
        },
        {
          text: 'No cancelar',
          style: 'cancel',
        },
        ]);
    }

    const updateProduct = (item, cantidad, monto = undefined, descuento = undefined, comentario = '') => {
        let datos = {
            id: item.IDREA,
            IDREC: recepcion.IDREC,
            update: {
                QUANT: parseInt(cantidad)
            }
        }
        
        if(monto >= 0) {
            datos.update.MONTO = parseFloat(monto);
        }
        if(descuento >= 0) {
            datos.update.QUAND = parseFloat(descuento);
        }
        //if(comentario) {
            datos.update.COMEN = comentario;
        //}
        
        setLoadingSave(true);
        console.log(datos);
        fetchIvan(props.ipSelect).put('/administrative/crudRecepcionItems', datos, props.token.token)
        .then(({data}) => {
            let prod = JSON.parse(JSON.stringify(productos));
            for(let i=0;i < prod.length;i++) {
                if(prod[i].IDREA == item.IDREA) {
                    prod[i].QUANT = parseInt(cantidad);
                    if(monto) {
                        prod[i].MONTO = parseFloat(monto);
                    }
                    if(descuento >= 0) {
                        prod[i].QUAND = parseFloat(descuento);
                    }
                    if(comentario) {
                        prod[i].COMEN = comentario;
                    }

                    prod[i].UMOID = props.dataUser.IDUSR;
                    prod[i].ActualizadoPor =  {
                        IDUSR: props.dataUser.IDUSR,
                        USLAS: props.dataUser.USLAS,
                        USNAM: props.dataUser.USNAM,
                        USNAA: props.dataUser.USNAA,
                    };
                    console.log(prod[i].MATNR, preProduct.MATNR, prod[i].LOTEA, lote)
                    if(prod[i].MATNR == preProduct.MATNR && ((prod[i].LOTEA && prod[i].LOTEA == lote) || !prod[i].LOTEA)) {
                        console.log("Se actualiza la cantidad", cantidad)
                        inputCantidad.current?.setNativeProps({text: cantidad.toString()});
                        setCantidad(parseInt(cantidad));
                        setPreProduct({...preProduct, ...prod[i]});
                    }
                    break;
                }
            }
            setProductos(prod);

            ToastAndroid.show(
                comentario ? "Comentario reflejado con éxito":(monto ? "Costo actualizado con éxito":"Cantidad actualizada con éxito"),
                ToastAndroid.LONG
            );
        })
        .catch(({status, error}) => {
            //console.log(status, error);
            if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                setMsgConex("¡Ups! Parece que no hay conexión a internet");
            }
            if(status === 406) {
                props.route.params.updateRecepcion({...recepcion, RESTS: error.status});
                props.navigation.goBack();

                return ToastAndroid.show(
                    error?.text || "Solicitud no aceptada, por el servidor",
                    ToastAndroid.LONG
                );
            }
                
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.LONG
            );
        })
        .finally(() => {
            setLoadingSave(false);
        })
    }

    const deleteItem = (name, id, matnr) => {
        Alert.alert('Confirmar', `¿Deseas eliminar la recepción (${name}) realmente?\nSe eliminarán todo los artículos creados`, [
        {
          text: 'Sí, deseo eliminar',
          style: 'destructive',
          onPress: () => {
            let datos = {
                IDREC: recepcion.IDREC,
                id: id
            };

            setLoading(true);
            fetchIvan(props.ipSelect).delete('/administrative/crudRecepcionItems', datos, props.token.token)
            .then(({data}) => {
                console.log("Recepcion eliminado: ", data.data);
                setProductos(productos.filter(t => t.IDREA != id));
                if(preProduct.IDREA == id || preProduct.MATNR == matnr) {
                   setPreProduct({});
                }
            })
            .catch(({status, error}) => {
                console.log(error);
                return ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.LONG
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
        },
        ]);
    }

    const RowProducts = (item, index) => 
        <HStack
            key={index}
            spacing={4}
            style={[styles.items,((item.UCRID == props.dataUser.IDUSR && (preProduct.MATNR === item.MATNR && item.UnidadBase.XCHPF !== 'X') || 
                        (item.UnidadBase.XCHPF === 'X' && item.LOTEA == lote && preProduct.MATNR === item.MATNR)) ? {backgroundColor: 'lightgreen'}:{}), {width: '100%'}]}
        >
            <VStack w="55%">
                <Text style={styles.title3}>{item.Producto.MAKTG ?? ""}</Text>
                <Text style={[styles.subtitle, {backgroundColor: 'yellow'}]}>{item.MATNR}</Text>
                {item.LOTEA && recepcion.RESTS === 'CREADO' && <Text style={styles.subtitle} color="primary">Lote: {item.LOTEA}</Text>}
                <Text style={[styles.subtitle2]}>Creado Por: {(item.CreadoPor?.USNAM ?? '')+" "+(item.CreadoPor?.USLAS ?? '')}</Text>
                {item.UCRID !== item.UMOID && <Text style={[styles.subtitle2]}>Actualizado Por: {(item.CreadoPor?.USNAM ?? '')+" "+(item.CreadoPor?.USLAS ?? '')}</Text>}
                {item.COMEN ? <Text style={[styles.subtitle2]}>Motivo devolución: {item.COMEN}</Text>:''}
            </VStack>

            {recepcion.RESTS === 'CREADO' ? 
            <VStack w="25%" style={{alignSelf: 'flex-end'}}>
                {(props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_ITEMS_UPDATE') !== -1) && 
                <Text style={[styles.subtitle2]} mt={0}>Costo ({recepcion.ProveedoresFijo?.WAERS}):</Text>}
                {(props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_ITEMS_UPDATE') !== -1) && 
                <TextInput
                    containerStyle={{fontSize: 5}} 
                    defaultValue={item.MONTO.toString()} 
                    numeric
                    textAlign={'center'}
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 90,
                        height: 45,
                        margin: 0
                    }}
                    inputStyle={{paddingEnd: 0, paddingStart: 0}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    onFocus={(e) => {
                        if(!item.MONTO) {
                            otroInput1.current[index]?.setNativeProps({text: ""});
                        }
                    }}
                    onEndEditing={(e) => {
                        let cant = '';
                        try {
                            cant = e.nativeEvent.text?.match(/(^\d+(?:\.\d+)?)/g)[0];
                            if(cant && cant[0] === '0' && cant !== '0') 
                                cant = cant.substring(1,cant.length);
                        } catch {
                        }
                        if((!cant && cant !== 0) || parseFloat(cant) < 0) {
                            if(item.MONTO) {
                                otroInput1.current[index]?.setNativeProps({text: item.MONTO.toString()});
                                return;
                            }
                        }
                        if(parseFloat(cant) == item.MONTO) return otroInput1.current[index]?.setNativeProps({text: item.MONTO.toString()});

                        console.log(cant, "cant")
                        otroInput1.current[index]?.setNativeProps({text: cant ?? '0'});
                        updateProduct(item, item.QUANT, parseFloat(cant ?? 0));
                    }}
                    ref={el => otroInput1.current ? otroInput1.current[index] = el:''} 
                    maxLength={10}
                />}
                {(props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_ITEMS_UPDATE') !== -1) && 
                <Text style={styles.subtitle2}>Cant.</Text>}
                {(props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_ITEMS_UPDATE') !== -1) && 
                <TextInput
                    containerStyle={{fontSize: 5}} 
                    defaultValue={item.QUANT.toString()} 
                    numeric
                    textAlign={'center'}
                    //onChangeText={(text) => changeQuantity2(item, text)} 
                    keyboardType="numeric" 
                    inputContainerStyle={{
                        width: 90,
                        height: 45,
                        margin: 0
                    }}
                    inputStyle={{paddingEnd: 0, paddingStart: 0}}
                    editable={!loadingSave}
                    pointerEvents="none"
                    onEndEditing={(e) => {
                        let cant = '';
                        try {
                            cant = e.nativeEvent.text?.match(/^[0-9]*$/g)[0];
                            if(cant && cant[0] === '0' && cant !== '0') 
                                cant = cant.substring(1,cant.length);
                        } catch {
                        }
                        if(parseFloat(cant) == item.QUANT) return otroInput2.current[index]?.setNativeProps({text: item.QUANT.toString()});

                        if(!cant || parseInt(cant) < 0) {
                            return otroInput2.current[index]?.setNativeProps({text: item.QUANT.toString()});
                        }
                        otroInput2.current[index]?.setNativeProps({text: cant})
                        updateProduct(item, parseInt(cant)); 
                    }}
                    ref={el => otroInput2.current ? otroInput2.current[index] = el:''} 
                    maxLength={10}
                    />}
               {/*<Text style={styles.subtitle}>{getCantUnidades(item, item.QUANT)}</Text>*/}
            </VStack>:
            <VStack w="30%">
                <Text style={styles.subtitle2}>Costo:</Text>
                <Text style={styles.subtitle}>{item.MONTO} {recepcion.ProveedoresFijo.WAERS}</Text>
                <Text style={styles.subtitle}>Cantidad:</Text>
                <Text style={styles.quantity}>{item.QUANT}</Text>
                <Text style={styles.subtitle}>Cant. devolución:</Text>
                <Text style={styles.quantity}>{item.QUAND}</Text>
                {item.LOTEA && <Text style={styles.subtitle}>Lote:</Text> }
                {item.LOTEA && <Text style={styles.lote}>{item.LOTEA}</Text>}
                {/* <Text style={styles.subtitle}>{getCantUnidades(item, item.QUANT)}</Text> */}
            </VStack>}
            <VStack w={recepcion.RESTS === 'CREADO' ? '20%':'15%'} style={{alignItems: 'center'}}>
            {recepcion.RESTS === 'CREADO' && (props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_ITEMS_DELETE') !== -1) &&
                <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => deleteItem(item.MAKTG, item.IDREA, item.MATNR)} style={{alignSelf: 'center'}}/>
            }
            {recepcion.RESTS === 'CREADO' && (props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 || props.dataUser.USSCO.split(',').indexOf('RECEPCION_DEVOLUCION') !== -1) &&
                <IconButton icon={p2=p2 => <Entypo name="back" {...p2}/> } onPress={() => setDialogVisible(index)}/>
            }
            {recepcion.RESTS === 'CREADO' && <Text style={[styles.subtitle2, {textAlign: 'center'}]}>Cant. dev.{"\n"}{item.QUAND}</Text>}
            </VStack>
        </HStack>
    ;

    const memoRows = useCallback((item, index) => RowProducts(item, index), [productos, preProduct.MATNR, loadingSave, recepcion, lote])

    const memoGet = useCallback(getProductos);

    return (
        <Provider>
            {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
            <ScrollView ref={scrollShow} nestedScrollEnabled={true} refreshControl={<RefreshControl refreshing={false} onRefresh={()=> memoGet(true)}/>}>
                <VStack>
                    <Text style={styles.title2}>{recepcion.DESCR}</Text>
                    {recepcion.RESTS === 'CREADO' ? 
                    <View> 
                        <VStack spacing={-8}>
                            <TextInput placeholder="Pulsa y escanea o escribe manualmente" 
                                autoFocus = {true} 
                                onEndEditing={(e) => findCode(e.nativeEvent.text) }
                                showSoftInputOnFocus={showKeyBoard}
                                ref={inputScan}
                                maxLength={18}
                                onFocus={() => inputScan.current?.clear()}
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
                        {preProduct.MATNR ?
                        <Box style={styles.box1}>
                            <HStack style={{justifyContent: 'space-between'}} spacing={4}>
                                <VStack style={[styles.row, {alignItems: 'flex-start', width: '65%'}]}>
                                    <Text style={[styles.small2, {width: '80%', flexWrap: 'wrap'}]}>{preProduct.MAKTG || preProduct.Producto?.MAKTG} </Text>
                                    <Text style={[styles.small2, {backgroundColor: 'yellow'}]}>{preProduct.MATNR} </Text>
                                    <Text style={styles.title3}>{getCantUnidades(preProduct)}</Text>
                                    <HStack spacing={4} style={{width: '90%', flexWrap: 'wrap'}}>
                                        <Text style={[styles.small2, {fontWeight: '600'}]}>Und. de escaneo: </Text>
                                        <Text style={styles.small2}>{preProduct.unidad_index?.UnidadDescripcion.MSEHL}</Text>
                                    </HStack>
                                </VStack>
                                <Stack w={"35%"}>
                                    <ImagesAsync ipSelect={props.ipSelect} imageCode={preProduct.MATNR} token={props.token.token} style={{backgroundColor: 'black'}}/>
                                </Stack>
                            </HStack>

                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{width: '100%'}}>
                                <HStack border={0.5} p={2} spacing={2} style={{borderRadius: 5}}>
                                    {preProduct.ProductosUnidads?.map((und, inx) => 
                                        <Chip key={inx} 
                                            variant="outlined" 
                                            label={und.UnidadDescripcion.MSEHL+"\nx"+und.UMREZ} 
                                            color={undSelect === und.MEINH ? Global.colorMundoTotal:'black'} 
                                            onPress={() => setUndSelect(und.MEINH)}
                                            labelStyle={{textAlign: 'center', fontSize: 12}}/>
                                    )}
                                </HStack>
                            </ScrollView>
                        </Box>:''}

                        {preProduct.MATNR &&
                        <HStack style={[styles.row, {justifyContent: 'space-between'}]}>
                            {preProduct.UnidadBase.XCHPF === 'X' &&
                            <VStack style={{alignItems: 'center'}}>
                                <Text>Lote:</Text>
                                <SelectInput
                                    searchable={false}
                                    data={preProduct.ProdConLotes?.reduce((p,i) => [...p, {value: i.CHARG, label: i.CHARG}],[{value: 'NEWLOTE', label: 'NUEVO LOTE'}])}
                                    value={lote}
                                    setValue={setLote}
                                    title="Elegir"
                                    buttonStyle={{marginLeft: 5}}
                                />
                            </VStack>}
                            <VStack mt={-4} spacing={4} style={{justifyContent: 'flex-end'}}>
                                {/* <HStack m={0} spacing={2} style={{alignItems: 'flex-end', flexWrap: 'nowrap', height: 'auto'}}>
                                    <Text style={styles.small2}>Cant. Disp:</Text>
                                    <Text style={styles.title3}>{preProduct.UnidadBase.XCHPF === 'X' ? (lote && preProduct.cantidadDispLote[lote]):(preProduct.cantidadDisp < 0 ? 0:preProduct.cantidadDisp)}</Text>
                                </HStack> */}
                                <HStack m={0} spacing={2} style={{alignItems: 'flex-end', flexWrap: 'nowrap', height: 'auto'}}>
                                    <Text style={styles.small2}>Cant. Unitaria:</Text>
                                </HStack>
                                <TextInput
                                    ref={inputCantidad}
                                    //value={cantidad.toString()} 
                                    //onChangeText={(text) => changeQuantity(text)} 
                                    onEndEditing={(e) => changeQuantityPost(e.nativeEvent.text)}
                                    numeric
                                    keyboardType="numeric"
                                    //editable={((preProduct.cantidadDispLote && lote && preProduct.cantidadDispLote[lote] > 0) || preProduct.cantidadDisp > 0) ? true:false}
                                    placeholder="10"
                                    textAlign={'center'}
                                    inputStyle={{marginTop: -18}}
                                    inputContainerStyle={{
                                        height: 30,
                                        padding: 10}}
                                        style={{alignItems: 'flex-end', width: 120, flexWrap: 'nowrap'}}
                                    maxLength={10}
                                    />
                            </VStack>
                        </HStack>}
                        {preProduct.UnidadBase?.XCHPF === 'X' && lote === 'NEWLOTE' ?
                        <VStack mt={6} spacing={-5}>
                            <HStack style={[styles.row, {flexWrap: 'wrap'}]}>
                                <Text>Fecha Vencimiento:</Text>
                                <Text>{dateLote}</Text>
                                <IconButton icon={props => <Ft name="date" {...props} />} onPress={() => setDatePickerVisibility(true)}/> 
                            </HStack>
                            <HStack style={{alignItems: 'center', justifyContent: 'space-around'}} ms={5}>
                                <Text style={{fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>{loteName ? 'Nombre asignado: '+loteName:''}</Text>
                                <TextInput
                                    autoCapitalize={"characters"}
                                    onEndEditing={(e) => setInputCuatro(e.nativeEvent.text)}
                                    placeholder="Iniciales"
                                    textAlign={'center'}
                                    inputStyle={{marginTop: -18}}
                                    inputContainerStyle={{
                                        height: 30,
                                        padding: 10,
                                        paddingHorizontal: 0}}
                                    style={{alignItems: 'flex-end', width: 90, flexWrap: 'nowrap'}}
                                    maxLength={4}
                                />
                            </HStack>
                        </VStack>:''
                        }

                        <Button title="Cargar" onPress={() => mode?.mode === 'update' ? updateProduct(preProduct, cantidad):addProduct({...preProduct, QUANT: cantidad})} color={Global.colorMundoTotal} loading={loading}
                            disabled={!cantidad || !Object.keys(preProduct).length || (preProduct.UnidadBase?.XCHPF === 'X' && lote === 'NEWLOTE' && !loteName) || (preProduct.UnidadBase?.XCHPF === 'X' && !lote) ? true:false} 
                            style={{marginTop: 10}}/>
                    </View>
                    :''}
                </VStack>

                {loading ? <ActivityIndicator />:''}
                <Stack style={styles.escaneados} mt={1}>
                    <HStack spacing={1} style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={styles.title2}>Prod. escaneados ({productos.length}):</Text>
                        {props.dataUser.USSCO.split(',').indexOf('ADMIN_RECEPCION') !== -1 && recepcion.RESTS === 'CREADO' && productos.length && <Button compact={true} color={Global.colorMundoTotal} title="Finalizar" onPress={finalizarRecepcion} disabled={loading || loadingSave} loading={loading || loadingSave}/>}
                    </HStack>
                    <ListaPerform
                        items={productos} 
                        renderItems={memoRows} 
                        heightRemove={recepcion.RESTS === 'CREADO' ? 135:160}
                        height={recepcion.RESTS === 'CREADO' ? 150:100}
                        />
                </Stack>
                <View style={{ width: 200, height: 10 }}></View>
            </ScrollView>
            <DateTimePickerModal
                locale="es-VE"
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={selectDate}
                onCancel={() => setDatePickerVisibility(false)}
                minimumDate={new Date()}
            />

            {productos.length && dialogVisible > -1 ?
            <Dialog visible={dialogVisible > -1 ? true:false} onDismiss={() => setDialogVisible(-1)} style={{zIndex: 100000, elevation: 100}}>
                <DialogContent>
                    <Stack spacing={1} mt={4} style={{textAlign: 'center'}}>
                        <Text style={styles.title2}>Cantidad de devolución: </Text>
                        <TextInput
                            defaultValue={productos[dialogVisible].QUAND.toString()} 
                            numeric
                            textAlign={'center'}
                            keyboardType="numeric" 
                            inputStyle={{paddingEnd: 0, paddingStart: 0}}
                            editable={!loadingSave}
                            pointerEvents="none"
                            onFocus={(e) => {
                                if(!productos[dialogVisible].QUAND) {
                                    otroInput3.current?.setNativeProps({text: ""});
                                }
                            }}
                            onEndEditing={(e) => {
                                let cant = '';
                                try {
                                    cant = e.nativeEvent.text?.match(/(^\d+(?:\.\d+)?)/g)[0];
                                    if(cant && cant[0] === '0' && cant !== '0') 
                                        cant = cant.substring(1,cant.length);
                                } catch {
                                }
                                if((!cant && cant !== 0) || parseFloat(cant) < 0) {
                                    if(productos[dialogVisible].QUAND) {
                                        otroInput3.current?.setNativeProps({text: productos[dialogVisible].QUAND.toString()});
                                        return;
                                    }
                                }
                                if(parseFloat(cant) == productos[dialogVisible].QUAND) return otroInput3.current?.setNativeProps({text: productos[dialogVisible].QUAND.toString()});

                                if(parseFloat(cant) > productos[dialogVisible].QUANT) {
                                    cant = productos[dialogVisible].QUANT?.toString();
                                    ToastAndroid.show('La cantidad de devolución no puede ser mayor a la recibida', ToastAndroid.LONG);
                                }
                                console.log(cant, "cant")
                                otroInput3.current?.setNativeProps({text: cant ?? '0'});
                                updateProduct(productos[dialogVisible], productos[dialogVisible].QUANT, undefined, parseFloat(cant ?? 0 ));
                            }}
                            ref={otroInput3} 
                            maxLength={10}
                        />
                        <Text style={styles.title2}>Ingresa un comentario referente a esta devolución: </Text>
                        <TextInput 
                            multiline={true}
                            numberOfLines={5}
                            defaultValue={productos[dialogVisible].COMEN ?? ''} 
                            maxLength={300}
                            returnKeyType="done"
                            blurOnSubmit={true}
                            onEndEditing={(e) => e.nativeEvent.text !== productos[dialogVisible].COMEN ? updateProduct(productos[dialogVisible], productos[dialogVisible].QUANT, undefined, undefined, e.nativeEvent.text):''}/>
                    </Stack>
                </DialogContent>
            </Dialog>:''}
        </Provider>
    )
}

const styles = StyleSheet.create({
    title2: {
        fontSize: 15,
        fontWeight: '600',
        padding: 5,
        alignSelf: 'center'
    },
    title3: {
        fontSize: 15,
        fontWeight: '600'
    },
    small2: {
        fontSize: 12,
    },
    row: {
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 2
    },
    th: {
        fontSize: 14,
        //borderWidth: 0.2,
        width: '40%',
        fontWeight: '500',
        textAlign: 'right'
    },
    td: {
        fontFamily: 'Cochin',
        fontSize: 17,
        width: '50%',
        fontWeight: '600',
        textAlign: 'left'
    },
    box1: {
        justifyContent: 'space-between',
        padding: 5,
        marginLeft: 5,
        marginEnd: 5,
        backgroundColor: 'lightgrey'
    },
    items: {
        justifyContent: 'space-between', 
        marginBottom: 1, 
        borderBottomWidth: 1
    },
    title3: {
        zIndex: 9,
        fontSize: 14,
        fontWeight: '500'
    },
    subtitle: {
        fontSize: 13,
    },
    subtitle2: {
        fontSize: 11,
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

export default ManagerProducts;