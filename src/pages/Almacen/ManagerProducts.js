import { ActivityIndicator, Button, HStack, Provider, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, ToastAndroid, View } from "react-native";
import SelectInput from "../../components/_virtualSelect";
import { ScrollView } from "react-native";
import { Alert } from "react-native";
import fetchIvan from "../../components/_fetch";
import ImagesAsync from "../../components/_imagesAsync";
const Global = require('../../../app.json');

const ManagerProducts = (props) => {
    const bodega = props.bodega;
    const [estructura, setEstructura] = useState({});
    const [codeID, setCodeID] = useState("");
    
    const [lote, setLote] = useState(null);
    const inputScan = useRef(null);
    const [preProduct, setPreProduct] = useState({});
    const [producto, setProducto] = useState({});
    const [cantidad, setCantidad] = useState(0);

    const [showKeyBoard, setShowKeyBoard] = useState(false);

    const [loading, setLoading] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    const inputCantidad = useRef(null);

    useEffect(() => {
        if(estructura.paleta) {
            console.log(estructura.nivel, estructura.pasillo, estructura.columna, estructura.rack, estructura.paleta)
            for(let bod of bodega.data) {
                if(bod.FLOOR == estructura.nivel &&
                    bod.AISLE == estructura.pasillo &&
                    bod.COLUM === estructura.columna &&
                    bod.RACKS === estructura.rack &&
                    bod.PALET === estructura.paleta) {
                        setCodeID(bod.IDDWA);
                        break;
                    }
            }
        } else {
            setCodeID(null);
        }
    }, [estructura])

    useEffect(() => {
        setCantidad(0);
    }, [lote]);

    const findCode = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        if(codigo) {
            inputScan.current?.setNativeProps({text: codigo});
            setLoading(true);
            let datos = [
                `code=${codigo}`,
                `WERKS=${props.centroId}`,
                `LGORT=${props.almacenId}`,
                `simpleData=true`
            ];
            fetchIvan(props.ipSelect).get('/administrative/findProductScan', datos.join('&'), props.token.token)
            .then(({data}) => {
                console.log(data);
                setLote(null);
                setCantidad(0);
                const prod = data.data;

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
                prod.cantidadDisp = prod.ProdSinLotes[0]?.LABST ?? 0;
                for(let p in prod.ArticulosBodegas) {
                    prod.cantidadDisp -= prod.ArticulosBodegas[p].QUANT;
                }
                if(prod.ProdConLotes.length) {
                    prod.cantidadDispLote = {};
                    for(let f in prod.ProdConLotes) {
                        let restar = 0;
                        for(let p in prod.ArticulosBodegas) {
                            if(prod.ArticulosBodegas[p].LOTEA === prod.ProdConLotes[f].CHARG) {
                                restar += prod.ArticulosBodegas[p].QUANT;
                            }
                        }
                        prod.cantidadDispLote[prod.ProdConLotes[f].CHARG] = prod.ProdConLotes[f].CLABS - restar;
                    }
                }
                console.log(prod);
                setPreProduct(prod);
                setProducto({});
            }).catch(({status, error}) => {
                console.log(status, error);
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
            });
        }
    }

    const codeFind2 = (code) => {
        if(code.length) {
            let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
            setCodeID(codigo?.join("") || "");
        } else {
            setCodeID("");
        }
    }

    const addProduct = () => {
        setLoading(true);
        let datos = {
            create: {
                IDDWA: codeID,
                MATNR: preProduct.MATNR,
                LOTEA: lote,
                QUANT: cantidad
            }
        };
        fetchIvan(props.ipSelect).post('/administrative/crudArtBodegas', datos, props.token.token)
        .then(({data}) => {
            setPreProduct({});
            setEstructura({});
            setCantidad(0);
            setProducto({...data.data, FLOOR: estructura.nivel, AISLE: estructura.pasillo, COLUM: estructura.columna, RACKS: estructura.rack, PALET: estructura.paleta, MAKTG: preProduct.MAKTG});
        }).catch(({status, error}) => {
            console.log(error);
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
        });
    }

    const scanQR = () => {
        if(codeID) {
            for(let space of bodega.data) {
                if(space.IDDWA == codeID) {
                    setEstructura({
                        nivel: space.FLOOR,
                        pasillo: space.AISLE,
                        columna: space.COLUM.toString(),
                        rack: space.RACKS.toString(),
                        paleta: space.PALET.toString()
                    });
                    return;
                }
            }
            Alert.alert("El código no corresponde a un identificador de paleta");
            setCodeID("");
        }
    }

    const changeQuantity = (qant) => {
        if(preProduct.cantidadDispLote && !lote) return;
        //console.log("Change quantity: "+cantidad)
        let cant = ''
        try {
            cant = qant.match(/^[0-9]*$/g)[0];
            if(cant && cant[0] === '0') 
                cant = cant.substring(1,cant.length);
        } catch {
        }
        if(!cant) {
            //return setScan({...preProduct, TCANT: cant})
            //setCantidad(cant);
            return inputCantidad.current?.setNativeProps({text: cant});
        }
        if(preProduct.cantidadDispLote) {
            if(parseInt(cant) <= preProduct.cantidadDispLote[lote]) {
                //setScan({...preProduct, TCANT: cant})
                //setCantidad(cant);
                return inputCantidad.current?.setNativeProps({text: cant});
            } else {
                //setCantidad(preProduct.cantidadDispLote[lote].toString());
                //setScan({...preProduct, TCANT: preProduct.cantidadDispLote[lote].toString()})
                return inputCantidad.current?.setNativeProps({text: preProduct.cantidadDispLote[lote].toString()});
            }
        } else {
            if(parseInt(cant) <= preProduct.cantidadDisp) {
                //setScan({...preProduct, TCANT: cant})
                //setCantidad(cant);
                return inputCantidad.current?.setNativeProps({text: cant});
            } else {
                //setCantidad(preProduct.cantidadDisp.toString());
                return inputCantidad.current?.setNativeProps({text: preProduct.cantidadDisp.toString()});
                //setScan({...preProduct, TCANT: preProduct.cantidadDisp.toString()})
            }
        }
    }

    const changeQuantityPost = (text) => {
        console.log("Hola soy change cantidad ",text);
        if(!text) {
            setCantidad(0);
            return inputCantidad.current?.setNativeProps({text: ""});
        }
        setCantidad(parseInt(text));
    }

    function getCantUnidades(producto) {
        if(!cantidad) return "";
        let paquete = Math.floor(cantidad/producto.unidad_index.UMREZ);
        let unidad = (cantidad - (paquete*producto.unidad_index.UMREZ));
    
        if(producto.noBase) {
            return (paquete == 0 || paquete > 1 ? getPrural(producto.unidad_index.UnidadDescripcion.MSEHL):producto.unidad_index.UnidadDescripcion.MSEHL.split(" ")[0])+": "+paquete+"\n"
                +(unidad == 0 || unidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+unidad;
        }
        return (cantidad == 0 || cantidad > 1 ? getPrural(producto.UnidadBase.UnidadDescripcion.MSEHL):producto.UnidadBase.UnidadDescripcion.MSEHL.split(" ")[0])+": "+cantidad;
    }

    return (
        <Provider>
            {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
            <ScrollView>
            {props.almacenId && bodega.data ?
                <VStack>
                    <HStack style={{alignSelf: 'center', alignItems: 'center'}}>
                        <Text style={styles.small2}>Activar teclado</Text>
                        <Switch value={showKeyBoard} onValueChange={() => setShowKeyBoard(!showKeyBoard)} autoFocus={false}/> 
                    </HStack>
                    {loading && <ActivityIndicator />}
                    {preProduct.MATNR ?
                    <HStack style={{justifyContent: 'space-between'}} mt={-10}>
                        <VStack style={[styles.row, {alignSelf: 'center'}]}>
                            <Text style={styles.small2}>{preProduct.MAKTG} </Text>
                            <HStack>
                                <Text style={[styles.small2, {fontWeight: '600'}]}>Unidad escaneada: </Text>
                                <Text style={styles.small2}>{preProduct.unidad_index.UnidadDescripcion.MSEHL}</Text>
                                {preProduct.noBase && <Text style={[styles.small2, {fontWeight: '600'}]}> | Unidades por {preProduct.unidad_index.UnidadDescripcion.MSEHL}: {preProduct.unidad_index.UMREZ}</Text>}
                            </HStack>
                            <HStack>
                                <Text style={[styles.small2, {fontWeight: '600'}]}>Unidad base: </Text>
                                <Text style={styles.small2}>{preProduct.UnidadBase.UnidadDescripcion.MSEHL}</Text>
                            </HStack>
                        </VStack>
                        <View style={{flex: 1}}>
                            <ImagesAsync ipSelect={props.ipSelect} imageCode={preProduct.MATNR} token={props.token.token} style={{backgroundColor: 'black'}}/>
                        </View>
                    </HStack>:''}
                    
                    <HStack style={styles.row}>
                        <Text style={{maxWidth: 140}}>Código de barrás:</Text>
                        <TextInput placeholder={"Pulsa y escanea"}
                            autoFocus = {true} 
                            onEndEditing={(e) => findCode(e.nativeEvent.text) }
                            showSoftInputOnFocus={showKeyBoard}
                            ref={inputScan}
                            style={{width: '62%', marginEnd: 5}}
                            onFocus={() => inputScan.current?.clear()}
                        />
                    </HStack>

                    {preProduct.MATNR &&
                    <HStack style={[styles.row, {justifyContent: 'space-between'}]}>
                        {preProduct?.ProdConLotes?.length ? 
                        <VStack style={{alignItems: 'center'}}>
                            <Text>Lote:</Text>
                            <SelectInput
                                searchable={true}
                                data={preProduct.ProdConLotes.reduce((p,i) => [...p, {value: i.CHARG, label: i.CHARG}],[])}
                                value={lote}
                                setValue={setLote}
                                title="Lote"
                                buttonStyle={{marginLeft: 5}}
                            />
                        </VStack>:''}
                        <VStack style={{justifyContent: 'flex-end', alignItems: 'flex-end'}}>
                            <Text style={styles.title2}>{getCantUnidades(preProduct)}</Text>
                        </VStack>
                        <VStack mt={-4} spacing={4} style={{justifyContent: 'flex-end'}}>
                            <HStack m={0} spacing={2} style={{alignItems: 'flex-end', flexWrap: 'nowrap', height: 'auto'}}>
                                <Text style={styles.small2}>Cant. Disp:</Text>
                                <Text style={styles.title3}>{preProduct.cantidadDispLote ? (lote && preProduct.cantidadDispLote[lote]):(preProduct.cantidadDisp < 0 ? 0:preProduct.cantidadDisp)}</Text>
                            </HStack>
                            <TextInput
                                ref={inputCantidad}
                                value={cantidad.toString()} 
                                onChangeText={(text) => changeQuantity(text)} 
                                onEndEditing={(e) => changeQuantityPost(e.nativeEvent.text)}
                                numeric
                                keyboardType="numeric"
                                editable={((preProduct.cantidadDispLote && lote && preProduct.cantidadDispLote[lote] > 0) || preProduct.cantidadDisp > 0) ? true:false}
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

                    <HStack style={[styles.row]}>
                        <Text style={{maxWidth: 150}}>Identificación de la paleta:</Text>
                        <TextInput placeholder={"Pulsa y escanea"}
                            autoFocus = {true} 
                            onChangeText={codeFind2}
                            onEndEditing={scanQR}
                            onFocus={() => setCodeID("")}
                            value={codeID}
                            showSoftInputOnFocus={showKeyBoard}
                            style={{width: '62%', marginEnd: 5}}
                            editable={Object.keys(preProduct).length ? true:false}
                        />
                        {/*<TextInput placeholder="Cant." 
                            style={{width: '28%', marginLeft: 10}}
                            editable={Object.keys(preProduct).length ? true:false} /> */}
                    </HStack>


                    <HStack style={styles.row}>
                        <Text style={{maxWidth: 120}}>Piso/Nivel:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra ? []:Object.keys(bodega.extra.Niveles).reduce((p,i) => [...p, {value: parseInt(i), label: i.toString()}],[])}
                            value={estructura.nivel}
                            setValue={(val) => setEstructura({nivel: val})}
                            title="Nivel"
                            disabled={Object.keys(preProduct).length ? false:true}
                        />
                        <Text style={{maxWidth: 120}}>Pasillo:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !estructura.nivel ? 
                                []:Object.keys(bodega.extra.Niveles[estructura.nivel].Pasillos).reduce((p,i) => [...p, {value: parseInt(i), label: i.toString()}],[])}
                            value={estructura.pasillo}
                            setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: val})}
                            title="Pasillo"
                            disabled={!estructura.nivel || !Object.keys(preProduct).length}
                        />
                    </HStack>
                    <HStack style={styles.row}>
                        <Text style={{maxWidth: 120}}>Columna:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !estructura.nivel || !estructura.pasillo ? 
                                []:Object.keys(bodega.extra.Niveles[estructura.nivel].Pasillos[estructura.pasillo].Columnas).reduce((p,i) => [...p, {value: i, label: i}],[])}
                            value={estructura.columna}
                            setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: estructura.pasillo, columna: val})}
                            title="Columna"
                            disabled={!estructura.pasillo || !Object.keys(preProduct).length}
                        />
                        <Text style={{maxWidth: 120}}>Rack:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !estructura.nivel || !estructura.pasillo || !estructura.columna ? 
                                []:Object.keys(bodega.extra.Niveles[estructura.nivel].Pasillos[estructura.pasillo].Columnas[estructura.columna].Racks).reduce((p,i) => [...p, {value: i, label: i}],[])}
                            value={estructura.rack}
                            setValue={(val) => setEstructura({nivel: estructura.nivel, pasillo: estructura.pasillo, columna: estructura.columna, rack: val})}
                            title="Rack"
                            disabled={!estructura.columna || !Object.keys(preProduct).length}
                        />
                    </HStack>
                    <HStack style={[styles.row, {justifyContent: 'space-around'}]}>
                        <Text style={{maxWidth: 120}}>Paleta:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !estructura.nivel || !estructura.pasillo || !estructura.columna  || !estructura.rack ? 
                                []:bodega.extra.Niveles[estructura.nivel].Pasillos[estructura.pasillo].Columnas[estructura.columna].Racks[estructura.rack].Paletas.reduce((p,i) => [...p, {value: i, label: i}],[])}
                            value={estructura.paleta}
                            setValue={(val) => setEstructura({...estructura, paleta: val})}
                            title="Paleta"
                            disabled={!estructura.rack || !Object.keys(preProduct).length}
                            buttonStyle={{width: 'auto'}}
                        />
                    </HStack>

                    <Button title="Cargar" onPress={addProduct} color={Global.colorMundoTotal} loading={loading}
                        disabled={!codeID || !estructura.columna || !estructura.nivel || !estructura.pasillo || !estructura.rack ||
                            !estructura.paleta || !cantidad || !Object.keys(preProduct).length} 
                        style={{marginTop: 10}}/>
                </VStack>
            :<Text>Selecciona un almacén para continuar</Text>}


            {Object.keys(producto).length ?
            <VStack 
                style={{marginTop: 5, borderWidth: 0.3, width: '99%', backgroundColor: 'lightgrey'}} 
                spacing={1}
                p={2}>
                <Text style={[styles.title2, {borderBottomWidth: 0.2}]}>{producto.MAKTG}</Text>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CÓDIGO MATERIAL:</Text>
                    <Text style={[styles.td, {backgroundColor: 'yellow'}]}>{producto.MATNR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>LOTE:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{producto.LOTEA}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>CANTIDAD:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{producto.QUANT}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>PISO/NIVEL:</Text>
                    <Text style={[styles.td, {color: 'black'}]}>{producto.FLOOR}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>PASILLO:</Text>
                    <Text style={[styles.td, {color: 'orange'}]}>{producto.AISLE}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>COLUMNA:</Text>
                    <Text style={[styles.td, {color: Global.colorMundoTotal}]}>{producto.COLUM}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>RACK:</Text>
                    <Text style={[styles.td, {color: 'red'}]}>{producto.RACKS}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>PALETA:</Text>
                    <Text style={[styles.td, {color: 'blue'}]}>{producto.PALET}</Text>
                </HStack>
                <HStack style={styles.row}>
                    <Text style={styles.th}>IDENTIFICACIÓN:</Text>
                    <Text style={[styles.td, {backgroundColor: 'lightgreen'}]}>{producto.IDDWA}</Text>
                </HStack>
            </VStack>:''}
            </ScrollView>
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