import { ActivityIndicator, Button, HStack, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useRef, useState, useEffect } from "react";
import { StyleSheet, Alert, ToastAndroid, Dimensions, View, ScrollView } from "react-native";
import KeyEvent from 'react-native-keyevent';
import { useCallback } from "react";
import ListaPerform from "../../components/_virtualList";
import fetchIvan from "../../components/_fetch";
import AntDesign from "react-native-vector-icons/AntDesign";
import ImagesAsync from "../../components/_imagesAsync";
import SelectInput from "../../components/_virtualSelect";
const Global = require('../../../app.json');

const dimensionesScreen = Dimensions.get('screen');
const FindProducts = (props) => {
    const bodega = props.bodega;
    
    const [loading, setLoading] = useState(false);
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const [msgConexion, setMsgConex] = useState('');
    const [estructura, setEstructura] = useState({});

    const [findProduct, setFindProduct] = useState([]);

    const inputScan = useRef(null);

    useEffect(() => {
        setEstructura({});
        setFindProduct([]);
    }, [props.almacenId]);

    const evento = (keyEvent) => { 
        if(!inputScan.current?.isFocused()) {
            if((keyEvent.keyCode >= 520 && keyEvent.keyCode <= 523) || keyEvent.keyCode === 103 || keyEvent.keyCode === 10036) { // Nos llaman con enter
                inputScan.current?.focus();
            }

            if(keyEvent.keyCode >= 29 && keyEvent.keyCode <= 54) { // A-Z
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            } else if(keyEvent.keyCode >= 7 && keyEvent.keyCode <= 16) { // 0-9
                if(inputScan.current) {
                    inputScan.current.focus();
                    inputScan.current.setNativeProps({ text: keyEvent.pressedKey })
                }
            }
        }
    }

    useEffect(() => { // Efecto de montura del componente
        if(props.tabActive && props.almacenId) {
            KeyEvent.onKeyDownListener(evento);
            setEstructura({});
            return () => {
                //console.log("Remove keyboard listener");
                KeyEvent.removeKeyDownListener();
            }
        } 
        if(!props.almacenId) {
            setEstructura({});
        }
    }, [props.tabActive, props.almacenId]);

    useEffect(() => { // efecto para cada vez que cambian los estados de las config nos pone modo FOCUS
        if(props.tabActive) {
            setTimeout(() => {
                inputScan.current?.focus()
            }, 200);
        }
    },[showKeyBoard, props.tabActive]);

    const codeFind = (code) => {
        //let codigo = code.split(',')[0].match(/([0-9])/g);
        //codigo = codigo?.join("") || "";
        let codigo = code.split(',')[0];
        if(codigo) {
            inputScan.current?.clear();
            inputScan.current?.focus();
            if(props.almacenId === null) {
                return Alert.alert("Selecciona el almácen primero");
            }
            if(codigo.length < 1) {
                return Alert.alert("El código o la búsqueda deben contener 1 caracter como mínimo.");
            }
            let find = false;
            console.log(codigo);
            if(codigo.indexOf("floor=") !== -1) {
                let estruct = {
                };
                let codigos = codigo.split(";");

                let nivel = codigos[0].split('=');
                if(nivel[0] === 'floor') {
                    estruct.nivel = parseInt(nivel[1]) ?? 0;
                }
                if(codigos.length > 1) {
                    let pasillo = codigos[1].split('=');
                    if(pasillo[0] === 'aisle') {
                        estruct.pasillo = parseInt(pasillo[1]) ?? 0;
                    }
                    if(codigos.length > 2) {
                        let columna = codigos[2].split('=');
                        if(columna[0] === 'column') {
                            estruct.columna = columna[1];
                        }
                    }
                    if(codigos.length > 3) {
                        let rack = codigos[3].split('=');
                        if(rack[0] === 'rack') {
                            estruct.rack = rack[1];
                        }
                    }
                }
                console.log(estruct);
                if(!bodega.extra.Niveles[estruct.nivel] || 
                    (estruct.pasillo && !bodega.extra.Niveles[estruct.nivel]?.Pasillos[estruct.pasillo]) || 
                    (estruct.columna && !bodega.extra.Niveles[estruct.nivel].Pasillos[estruct.pasillo].Columnas[estruct.columna]) ||
                    (estruct.rack && !bodega.extra.Niveles[estruct.nivel].Pasillos[estruct.pasillo].Columnas[estruct.columna].Racks[estruct.rack])) {
                    return Alert.alert("El código no corresponde a un identificador en el almacen");
                }
                setEstructura(estruct);
                return buscarBodega(estruct);
            } else {
                for(let space of bodega.data) {
                    if(space.IDDWA == codigo) {
                        setEstructura({
                            nivel: space.FLOOR,
                            pasillo: space.AISLE,
                            columna: space.COLUM.toString(),
                            rack: space.RACKS.toString(),
                            paleta: bodega.extra.Niveles[space.FLOOR].Pasillos[space.AISLE].Columnas[space.COLUM.toString()].Racks[space.RACKS.toString()].Paletas.map((d) => d.PALETA).indexOf(space.PALET.toString())
                        });
                        find = true;
                        break;
                    }
                }
                if(!find) {
                    return Alert.alert("El código no corresponde a un identificador en el almacen");
                }

                setFindProduct([]);
                setLoading(true);
                let datos = [
                    `IDDWA=${codigo}`,
                    `WERKS=${props.centroId}`,
                    `LGORT=${props.almacenId}`,
                ];
                fetchIvan(props.ipSelect).get('/administrative/crudArtBodegas', datos.join('&'), props.token.token)
                .then(({data}) => {
                    console.log(data);
                    setFindProduct(data.data);
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
        }
    }

    const buscarBodega = (esctruc) => {
        setFindProduct([]);
        setLoading(true);
        let datos = [
            `WERKS=${props.centroId}`,
            `LGORT=${props.almacenId}`
        ];
        if(esctruc.nivel) datos.push(`FLOOR=${esctruc.nivel}`);
        if(esctruc.pasillo) datos.push(`AISLE=${esctruc.pasillo}`);
        if(esctruc.columna) datos.push(`COLUM=${esctruc.columna}`);
        if(esctruc.racks) datos.push(`RACKS=${esctruc.racks}`);
        if(esctruc.paleta) datos.push(`PALET=${esctruc.paleta}`);

        fetchIvan(props.ipSelect).get('/administrative/crudArtBodegas', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            setFindProduct(data.data);
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

    const borrarItem = (item) => {
        Alert.alert('Confirmar', `¿Deseas eliminar el articulo ${item.Producto?.MAKTG}?`, [
            {
                text: 'Sí',
                onPress: () => {
                    setLoading(true);
                    let datos = {
                        id: item.IDADW
                    }
                    fetchIvan(props.ipSelect).delete('/administrative/crudArtBodegas', datos, props.token.token)
                    .then(({data}) => {
                        console.log(data);
                        setFindProduct(findProduct.filter((a) => a.IDADW !== item.IDADW));
                        ToastAndroid.show("Producto eliminado con éxito", ToastAndroid.LONG);
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
                },
            },
            {
              text: 'No',
              style: 'cancel',
            },
        ]);
    }

    const getConcatItem = (item) => {
        return `${item.Bodega?.FLOOR ?? ''}-${item.Bodega?.AISLE ?? ''}-${item.Bodega?.COLUM ?? ''}-${item.Bodega?.RACKS ?? ''}-${item.Bodega?.PALET ?? ''}`;
    }

    const RowProducts = (item, index) => {
        return (
            <VStack 
                style={{marginTop: 5, borderWidth: 0.3, width: '99%', backgroundColor: 'lightgrey', height: item.Bodega.BLOQU ? 'auto':175}} 
                spacing={3}
                p={1}
                key={index}>
                <Text style={[styles.title2, {borderBottomWidth: 0.2}]} numberOfLines={1}>{item.Producto?.MAKTG ?? ''}</Text>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CÓDIGO MATERIAL:</Text>
                    <Text style={[styles.td, {backgroundColor: 'yellow'}]}>{item.MATNR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>LOTE:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.LOTEA}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CANTIDAD:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{item.QUANT} Unidad{item.QUANT != 1 ? 'es':''}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>RESERVADOS:</Text>
                    <Text style={[styles.td, {color: 'red'}]} numberOfLines={1}>{item.RESERVADOS ?? 0} Unidad{item.RESERVADOS != 1 ? 'es':''}</Text>
                </HStack>
                {item.Bodega?.BLOQU && 
                <VStack style={[styles.row, {alignItems: 'center'}]}>
                    <Text style={[styles.th, {color: 'red', textAlign: 'center', width: '100%'}]}>¡Ubicación BLOQUEADA!</Text>
                    <Text style={[styles.td, {fontSize: 10.5, textAlign: 'justify', width: '100%'}]} numberOfLines={5}>{item.Bodega?.COMEB}</Text>
                </VStack>}
                <HStack style={[styles.row, {alignItems: 'center', justifyContent: 'flex-end', left: -16}]} spacing={5}>
                    <Text style={[styles.td, {backgroundColor: 'lightgreen', width: 'auto', maxWidth: '75%', textAlign: 'center', fontSize: 12, padding: 3}]} numberOfLines={2}>{item.IDDWA}{"\n"}{getConcatItem(item)}</Text>
                    {props.dataUser.USSCO.indexOf('DEL_ARTBODEGA') !== -1 && !item.RESERVADOS ?
                    <Button color="white" title={<AntDesign name="delete" color="red" size={20}/>} onPress={() => borrarItem(item)}/>
                    :''}
                </HStack>
                <View style={styles.imagenPosition}>
                    <ImagesAsync ipSelect={props.ipSelect} imageCode={item.MATNR} token={props.token.token} imageStyle={{height: 70, width: 70}} msg={false}/>
                </View>
            </VStack>
        )
    }
    
    const memoRows = useCallback((item, index) => RowProducts(item, index), [findProduct])

    return (
        <Stack spacing={2} m={4} style={{flex: 1}}> 
           {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
            <ScrollView nestedScrollEnabled={true}>
            {props.almacenId && bodega.data ?
            <VStack style={{width: '100%', flexWrap: 'nowrap'}}>
                <HStack style={{alignSelf: 'center', alignItems: 'center'}}>
                    <Text style={styles.small2}>Activar teclado</Text>
                    <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                </HStack>
                
                {loading && <ActivityIndicator />}
                    
                <TextInput placeholder={props.almacenId !== null ? "Pulsa y escanea QR":"Selecciona el almacén"}
                    autoFocus = {true} 
                    onEndEditing={(e) => codeFind(e.nativeEvent.text) }
                    showSoftInputOnFocus={showKeyBoard}
                    ref={inputScan}
                    keyboardType="numeric"
                    //editable={props.almacenId ? true:false}
                />

                <HStack style={styles.row}>
                    <Text style={[styles.small3, {maxWidth: 120}]}>{bodega.extra?.Nombres?.FLNAM || "Piso/Nivel"}:</Text>
                    <SelectInput
                        searchable={true}
                        data={!bodega.extra ? []:Object.keys(bodega.extra.Niveles).reduce((p,i) => [...p, {value: parseInt(i), label: i.toString()}],[{value: null, label: ""}])}
                        value={estructura.nivel}
                        setValue={(val) => setEstructura({nivel: val})}
                        title={bodega.extra?.Nombres?.FLNAM || "Piso/Nivel"}
                    />
                    <Text style={[styles.small3, {maxWidth: 120}]}>{bodega.extra?.Nombres?.AINAM || "Pasillo"}:</Text>
                    <SelectInput
                        searchable={true}
                        data={!bodega.extra || !estructura.nivel || !bodega.extra.Niveles[estructura.nivel] ? 
                            []:Object.keys(bodega.extra.Niveles[estructura.nivel]?.Pasillos).reduce((p,i) => [...p, {value: parseInt(i), label: i.toString()}],[{value: null, label: ""}])}
                        value={estructura.pasillo}
                        setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: val})}
                        title={bodega.extra?.Nombres?.AINAM || "Pasillo"}
                    />
                </HStack>
                <HStack style={styles.row}>
                    <Text style={[styles.small3, {maxWidth: 120}]}>{bodega.extra?.Nombres?.CONAM || "Columna"}:</Text>
                    <SelectInput
                        searchable={true}
                        data={!bodega.extra || !estructura.nivel || !estructura.pasillo || !bodega.extra.Niveles[estructura.nivel] || !bodega.extra.Niveles[estructura.nivel]?.Pasillos[estructura.pasillo] ?
                            []:Object.keys(bodega.extra.Niveles[estructura.nivel]?.Pasillos[estructura.pasillo]?.Columnas).reduce((p,i) => [...p, {value: i, label: i}],[{value: null, label: ""}])}
                        value={estructura.columna}
                        setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: estructura.pasillo, columna: val})}
                        title={bodega.extra?.Nombres?.CONAM || "Columna"}
                    />
                    <Text style={[styles.small3, {maxWidth: 120}]}>{bodega.extra?.Nombres?.RANAM || "Rack"}:</Text>
                    <SelectInput
                        searchable={true}
                        data={!bodega.extra || !estructura.nivel || !estructura.pasillo || !estructura.columna ? 
                            []:Object.keys(bodega.extra.Niveles[estructura.nivel].Pasillos[estructura.pasillo].Columnas[estructura.columna].Racks).reduce((p,i) => [...p, {value: i, label: i}],[{value: null, label: ""}])}
                        value={estructura.rack}
                        setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: estructura.pasillo, columna: estructura.columna, rack: val})}
                        title={bodega.extra?.Nombres?.RANAM || "Rack"}
                    />
                </HStack>
                <HStack style={[styles.row, {justifyContent: 'space-around'}]}>
                    <Text style={[styles.small3, {maxWidth: 120}]}>{bodega.extra?.Nombres?.PANAM || "Paleta"}:</Text>
                    <SelectInput
                        searchable={true}
                        data={!bodega.extra || !estructura.nivel || !estructura.pasillo || !estructura.columna  || !estructura.rack ? 
                            []:bodega.extra.Niveles[estructura.nivel].Pasillos[estructura.pasillo].Columnas[estructura.columna].Racks[estructura.rack].Paletas.reduce((p,i,idx) => [...p, {value: idx, label: i.PALETA}],[{value: null, label: ""}])}
                        value={estructura.paleta}
                        setValue={(val) => setEstructura({...estructura, paleta: val})}
                        title={bodega.extra?.Nombres?.PANAM || "Paleta"}
                        buttonStyle={{width: 'auto'}}
                    />
                </HStack>

                <Button title="Buscar" onPress={() => buscarBodega(estructura)} color={Global.colorMundoTotal} loading={loading}
                    disabled={(!estructura.columna && !estructura.nivel && !estructura.pasillo && !estructura.rack &&
                        !estructura.paleta) || !props.almacenId} 
                    style={{marginTop: 10}}/>

                </VStack>:<Text>Selecciona un almacén para continuar</Text>}
                <ListaPerform
                    items={findProduct} 
                    renderItems={memoRows} 
                    //heightRemove={dimensionesScreen.height < 600 ? 330:375}
                    //height={190}
                    />
            
            </ScrollView>
        </Stack>
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
    small3: {
        fontSize: 13,
    },
    row: {
        justifyContent: 'space-around', 
        alignItems: 'center',
        marginTop: 1
    },
    th: {
        fontSize: 12,
        //borderWidth: 0.2,
        width: '40%',
        fontWeight: '500',
        textAlign: 'right'
    },
    td: {
        fontFamily: 'Cochin',
        fontSize: 15,
        width: '50%',
        fontWeight: '600',
        textAlign: 'left'
    },
    imagenPosition: {
        position: 'absolute',
        end: 5,
        top: 60
    }
});

export default FindProducts;