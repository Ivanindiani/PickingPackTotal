import { ActivityIndicator, Button, HStack, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, ToastAndroid } from "react-native";
import SelectInput from "../../components/_virtualSelect";
import { ScrollView } from "react-native";
import { Alert } from "react-native";
import fetchIvan from "../../components/_fetch";
const Global = require('../../../app.json');

const ManagerProducts = (props) => {
    const [nivel, setNivel] = useState(null);
    const [pasillo, setPasillo] = useState(null);
    const [columna, setColumna] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [lote, setLote] = useState(null);
    const bodega = props.bodega;
    const [showKeyBoard, setShowKeyBoard] = useState(false);
    const inputScan = useRef(null);
    const [codeID, setCodeID] = useState("");
    const [producto, setProducto] = useState({});
    const [preProduct, setPreProduct] = useState({});
    const [loading, setLoading] = useState(false);
    const [msgConexion, setMsgConex] = useState('');

    useEffect(() => {
        if(archivo) {
            console.log(nivel, pasillo, columna, archivo)
            for(let bod of bodega.data) {
                if(bod.FLOOR == nivel &&
                    bod.AISLE == pasillo &&
                    bod.COLUM === columna &&
                    bod.RACKS === archivo) {
                        setCodeID(bod.IDDWA);
                        break;
                    }
            }
        } else {
            setCodeID(null)
        }
    }, [archivo])

    const findCode = (code) => {
        let codigo = code.split(',')[0].match(/([A-Z|a-z|0-9])/g);
        codigo = codigo?.join("") || "";
        if(codigo) {
            setLoading(true);
            let datos = [
                `code=${codigo}`,
                `WERKS=${props.centroId}`,
                `LGORT=${props.almacenId}`
            ];
            fetchIvan(props.ipSelect).get('/administrative/findProductScan', datos.join('&'), props.token.token)
            .then(({data}) => {
                setPreProduct(data.data);
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
                QUANT: 1
            }
        };
        fetchIvan(props.ipSelect).post('/administrative/crudArtBodegas', datos, props.token.token)
        .then(({data}) => {
            setPreProduct({});
            setCodeID("");
            setNivel(null);
            setPasillo(null);
            setColumna(null);
            setArchivo(null);
            setProducto({...data.data, FLOOR: nivel, AISLE: pasillo, COLUM: columna, RACKS: archivo, MAKTG: preProduct.MAKTG});
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
                if(space.IDDWA === codeID) {
                    setNivel(space.FLOOR.toString());
                    setPasillo(space.AISLE.toString());
                    setColumna(space.COLUM);
                    setArchivo(space.RACKS);
                    return;
                }
            }
            Alert.alert("El código no corresponde a un identificador de Rack");
            setCodeID("");
        }
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
                    {preProduct.MAKTG ?
                    <VStack style={[styles.row, {alignSelf: 'center'}]}>
                        <Text style={styles.small2}>{preProduct.MAKTG} </Text>
                        {/*<HStack>
                            <Text style={[styles.small2, {fontWeight: '600'}]}>Unidad escaneada: </Text>
                            <Text style={styles.small2}>{preProduct.ProductosUnidads[0].UnidadDescripcion.MSEHL} | </Text>
                            {preProduct.ProductosUnidads[0].UnidadDescripcion.MEINH !== 'ST' ?
                                <Stack>
                                    <Text style={[styles.small2, {fontWeight: '600'}]}>Unidades por {preProduct.ProductosUnidads[0].UnidadDescripcion.MSEHL}: </Text>
                            <Text style={styles.small2}>{preProduct.ProductosUnidads[0].</Text>
                                </Stack>
                            }
                        </HStack>*/}
                    </VStack>:''}
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
                    
                    {preProduct?.ProdConLotes?.length ? 
                    <HStack style={[styles.row, {justifyContent: 'space-around'}]}>
                        <Text style={{maxWidth: 150}}>Lote:</Text>
                        <SelectInput
                            searchable={true}
                            data={preProduct.ProdConLotes.reduce((p,i) => [...p, {value: i.CHARG, label: i.CHARG}],[])}
                            value={lote}
                            setValue={setLote}
                            title="Lote"
                            buttonStyle={{marginLeft: 5}}
                        />
                    </HStack>:''}

                    <HStack style={[styles.row]}>
                        <Text style={{maxWidth: 150}}>Identificación del Rack:</Text>
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
                            data={!bodega.extra ? []:Object.keys(bodega.extra.Niveles).reduce((p,i) => [...p, {value: parseInt(i), label: i}],[])}
                            value={nivel}
                            setValue={(val) => {setArchivo(null); setColumna(null); setPasillo(null); setNivel(val)}}
                            title="Nivel"
                            disabled={Object.keys(preProduct).length ? false:true}
                        />
                        <Text style={{maxWidth: 120}}>Passillo:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !nivel ? []:Object.keys(bodega.extra.Niveles[nivel].Pasillos).reduce((p,i) => [...p, {value: i, label: i.toString()}],[])}
                            value={pasillo}
                            setValue={(val) => {setArchivo(null); setColumna(null); setPasillo(val)}}
                            title="Pasillo"
                            disabled={Object.keys(preProduct).length ? false:true}
                        />
                    </HStack>
                    <HStack style={styles.row}>
                        <Text style={{maxWidth: 120}}>Columna:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !nivel || !pasillo ? []:Object.keys(bodega.extra.Niveles[nivel].Pasillos[pasillo].Columnas).reduce((p,i) => [...p, {value: i, label: i}],[])}
                            value={columna}
                            setValue={(val) => {setArchivo(null); setColumna(val);}}
                            title="Columna"
                            disabled={Object.keys(preProduct).length ? false:true}
                        />
                        <Text style={{maxWidth: 120}}>Rack:</Text>
                        <SelectInput
                            searchable={true}
                            data={!bodega.extra || !nivel || !pasillo || !columna ? []:bodega.extra.Niveles[nivel].Pasillos[pasillo].Columnas[columna].Racks.reduce((p,i) => [...p, {value: i, label: i.toString()}],[])}
                            value={archivo}
                            setValue={setArchivo}
                            title="Rack"
                            disabled={Object.keys(preProduct).length ? false:true}
                        />
                    </HStack>

                    <Button title="Cargar" onPress={addProduct} disabled={!codeID || !columna || !nivel || !pasillo || !archivo || !Object.keys(preProduct).length} style={{marginTop: 10}}/>
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
    small2: {
        fontSize: 11,
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

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}
export default ManagerProducts;