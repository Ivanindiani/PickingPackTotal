import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, ListItem, Provider, Stack, Switch, Text, TextInput } from "@react-native-material/core";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import SelectInput from "../components/_virtualSelect";
const Global = require("../../app.json");

const statusColor = {
    CREADO: 'yellow',
    RECIBIDO: 'lightgreen',
    CONFIRMADO: 'green',
    REENVIAR: 'orange',
    CANCELADO: 'red'
};

const Recepcion = (props) => {
    const [centroId, setCentroId] = useState(props.dataUser.Centros?.length === 1 ? props.dataUser.Centros[0].WERKS:null);
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? [...prev, {label: d.NAME1, value: d.WERKS}]:prev,[]):[]);
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [recepciones, setRecepciones] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [tipoProveedor, setTiposProveedor] = useState([]);
    const [tipo_proveedor_id, setTipoProveedorID] = useState(null);
    const [grupoProveedor, setGruposProveedor] = useState([]);
    const [grupo_proveedor_id, setGrupoProveedorID] = useState(null);
    const [proveedor_id, setProveedorID] = useState('');
    const [filtrado, setFiltrado] = useState(10);
    const [showCrear, setShowCrear] = useState(false);

    useEffect(() => {
        if(props.dataUser.Centros.length === 1) {
            setCentroId(props.dataUser.Centros[0]?.WERKS);
        }
        if(centroId) {
            let almacenesAux = [];
            for(let centro of props.dataUser.Centros) {
                if(centro.WERKS == centroId) {
                    almacenesAux = centro.Almacenes?.reduce((prev, al) => [...prev, {label: al.LGOBE, value: al.LGORT}], []);
                    break;
                }
            }
            console.log(almacenesAux);
            setAlmacenes(almacenesAux);
            setAlmacenId(null);
        }
    }, [centroId]);

    useEffect(() => {
        getGruposProveedor();
    }, []);
    useEffect(() => {
        if(centroId && almacenId) {
            getRecepciones();
        } else {
            setRecepciones([])
        }
    }, [almacenId, filtrado]);

    function getGruposProveedor() {
        setLoading(true);
        fetchIvan(props.ipSelect).get('/administrative/getGruposProveedor', null, props.token.token)
        .then(({data}) => {
            console.log(data.data);
            setTiposProveedor(data.data.tipoProveedores?.reduce((prev, tp) => [...prev, {label: tp.EKOTX, value: tp.EKORG}], []) ?? []);
            setGruposProveedor(data.data.grupoProveedor?.reduce((prev, tp) => [...prev, {label: tp.EKNAM, value: tp.EKGRP}], []) ?? []);
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    function getRecepciones() {
        let datos = [
            `find={"WERKS": "${centroId}", "LGORT": "${almacenId}", "RESTS": "['CREADO','RECIBIDO', 'CONFIRMADO', 'REENVIAR']"}`,
            `orderBy=[["IDREC", "DESC"]]`
        ];
        if(filtrado !== -1) {
            datos.push(`limit=${filtrado}`);
        }
        setLoading(true);
        setRecepciones([]);
        fetchIvan(props.ipSelect).get('/administrative/crudRecepcion', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log(data);
            setRecepciones(data.data);
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    const crearRecepcion = () => {
        let datos = {
            create: {
                WERKS: centroId,
                LGORT: almacenId,
                DESCR: descripcion,
                EKORG: tipo_proveedor_id,
                EKGRP: grupo_proveedor_id,
                LIFNR: proveedor_id.padStart(10, "0"),
                RESTS: 'CREADO'
            }
        }

        setLoading(true);
        fetchIvan(props.ipSelect).post('/administrative/crudRecepcion', datos, props.token.token)
        .then(({data}) => {
            console.log("Recepcion creada: ", data.data);
            data.data.CreadoPor = {
                IDUSR: props.dataUser.IDUSR,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor = data.data.CreadoPor;
            console.log(data.data);
            setRecepciones([data.data, ...recepciones]);
            setDescripcion('');
            setGrupoProveedorID(null),
            setProveedorID('');
            setTipoProveedorID(null);
        })
        .catch(({status, error}) => {
            console.log(error);
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_LFA1_MANDT_LIFNR') !== -1) {
                return ToastAndroid.show('Compruebe el ID del proveedor, el ingresado no existe', ToastAndroid.SHORT);
            }
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_T024E_MANDT_EKORG') !== -1) {
                return ToastAndroid.show('Compruebe el tipo de proveedor, el ingresado no existe', ToastAndroid.SHORT);
            }
            if(error?.message?.indexOf('FK_ZSD_RECEPCIONS_T024_MANDT_EKGRP') !== -1) {
                return ToastAndroid.show('Compruebe el grupo de proveedor, el ingresado no existe', ToastAndroid.SHORT);
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

    const dropRecepcion = (name, id) => {
        Alert.alert('Confirmar', `¿Deseas eliminar la recepción (${name}) realmente?\nSe eliminarán todo los artículos creados`, [
        {
          text: 'Sí, deseo eliminar',
          style: 'destructive',
          onPress: () => {
            let datos = {
                id: id,
                update: {
                    RESTS: 'CANCELADO'
                }
            };

            setLoading(true);
            fetchIvan(props.ipSelect).put('/administrative/crudRecepcion', datos, props.token.token)
            .then(({data}) => {
                console.log("Recepcion eliminado: ", data.data);
                setRecepciones(recepciones.filter(t => t.IDREC != id));
            })
            .catch(({status, error}) => {
                console.log(error);
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
        },
        ]);
    }

    const updateRecepcion = (recepcion) => {
        let auxRecepciones = JSON.parse(JSON.stringify(recepciones));
        auxRecepciones.map((t,k)=>{
            if(t.IDREC === recepcion.IDREC) {
                auxRecepciones[k] = recepcion;
            }
        });
        setRecepciones(auxRecepciones);
        console.log("Recepciones actualizados");
    }
    
    return (
        <Provider>
            <Stack spacing={1} style={{ margin: 5 }}>
                <View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                    <SelectInput
                        searchable={false}
                        data={centrosUser}
                        value={centroId}
                        setValue={setCentroId}
                        title="Sucursal Origen"
                        buttonStyle={{maxWidth: '70%', padding: 3}}
                    />
                    {!centrosUser.length && <Text style={{fontWeight: '500'}}>No tienes centros asignados</Text>}
                </View>
            
                {centroId && almacenes.length ?<View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>División: </Text>
                    <SelectInput
                        searchable={false}
                        data={almacenes}
                        value={almacenId}
                        setValue={setAlmacenId}
                        title="División origen"
                        buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                        disabled={!centroId ? true:false}
                    />
                </View>:''}
                
                <ScrollView nestedScrollEnabled={true}  style={styles.scrollView}>
                    {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 &&
                    <Button style={styles.title1} title="Crear Recepción" color="white" tintColor={Global.colorMundoTotal} onPress={() => setShowCrear(!showCrear)}
                        leading={props => <MaterialCommunityIcons name={showCrear ? "menu-down":"menu-right"} {...props} size={24}/> } />}
                    {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && showCrear ?  
                    <Box style={styles.box}>
                        <TextInput 
                            variant="standard" 
                            placeholder="Descripción, nº factura, etc.."
                            value={descripcion}
                            onChangeText={(text) => setDescripcion(text)}
                            maxLength={50}></TextInput>
                        <HStack style={{gap: 2, maxWidth: '100%', justifyContent: 'space-between'}} ms={-7}>
                            <SelectInput
                                searchable={false}
                                data={tipoProveedor}
                                value={tipo_proveedor_id}
                                setValue={setTipoProveedorID}
                                titleStyle={{fontSize: 9}}
                                title="Tipo Proveedor"/>
                            <SelectInput
                                searchable={false}
                                data={grupoProveedor}
                                value={grupo_proveedor_id}
                                setValue={setGrupoProveedorID}
                                titleStyle={{fontSize: 9}}
                                title="Grupo Proveedor"/>
                        </HStack>
                        <TextInput 
                            variant="standard" 
                            placeholder="ID PROVEEDOR"
                            value={proveedor_id}
                            onChangeText={(text) => setProveedorID(text)}
                            onEndEditing={(e) => e.nativeEvent.text.length && setProveedorID(e.nativeEvent.text.padStart(10, "0"))}
                            maxLength={10}></TextInput>
                        <Button loading={loading}
                            title="Crear" 
                            color="secondary" 
                            onPress={crearRecepcion}
                            disabled={!descripcion.length || !tipo_proveedor_id || !grupo_proveedor_id || !proveedor_id.length || loading || !almacenId}
                            style={{marginTop: 5, zIndex: -1}}/>
                    </Box>:''}
                    <Stack style={styles.scrollView}>
                        <HStack style={{justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 5}}>
                            <Text>{"Lista de recepciones\n"}</Text>
                            <SelectInput
                                data={[{label: '10', value: 10},{label: '25', value: 25},{label: '50', value: 50},{label: '100', value: 100},{label: 'Todos', value: -1}]}
                                value={filtrado}
                                setValue={setFiltrado}
                                title=""
                            />
                        </HStack>
                        {recepciones.map((recepcion, i) => 
                            <ListItem
                                key={i}
                                overline={recepcion.RESTS}
                                title={recepcion.DESCR}
                                secondaryText={"Proveedor: "+recepcion.LIFNR+"\n"+new Date(recepcion.DATEC).toLocaleString()}
                                leading={<Entypo name="circle" size={24} backgroundColor={statusColor[recepcion.RESTS]} color={statusColor[recepcion.RESTS]} style={{borderRadius: 12}} />}
                                trailing={(p2) => 
                                    <View>
                                        {props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1 && recepcion.RESTS === 'CREADO' ? 
                                        <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropRecepcion(recepcion.DESCR, recepcion.IDREC)}/>:''}
                                    </View>
                                }
                                onPress={() => props.dataUser.USSCO.indexOf('RECEPCION_FIND') !== -1  || props.dataUser.USSCO.indexOf('ADMIN_RECEPCION') !== -1
                                    ? props.navigation.navigate('Picking', {
                                        centroId: centroId,
                                        almacenId: almacenId,
                                        recepcion: recepcion,
                                        updateRecepcion: updateRecepcion
                                }):''}
                            />
                        )}
                        {!recepciones.length && <Text>No hay recepciones creadas</Text>}
                    </Stack>
                    <View style={{ width: 200, height: 80 }}></View>
                </ScrollView>
                {loading && <ActivityIndicator />}
            </Stack>
        </Provider>

    )
}

export default Recepcion;

const styles = StyleSheet.create({
    scrollView: {
        marginTop: 10,
        zIndex: 9
    }, 
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 13,
    },
    centros: {
        width: "99%",
        //alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    box: {
        marginTop: 5,
        backgroundColor: "lightgrey",
        padding: 10,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    }
})