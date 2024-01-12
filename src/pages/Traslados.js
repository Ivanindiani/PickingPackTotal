import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, ListItem, Provider, Stack, Switch, Text, TextInput } from "@react-native-material/core";
import { memo, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import SelectInput from "../components/_virtualSelect";
const Global = require("../../app.json");
//import { DeviceEventEmitter } from "react-native";

//import ScannerReceiver from "../components/_scannerModule";

const trasladosStatus = ['Eliminado', 'En progreso', 'En Tránsito, en espera de SAP', 'En Tránsito, cargado en SAP', 'Recibido, en espera de TotalPost', 'Completado', 'Devuelto en espera de SAP', 'Devuelto'];
const trasStatusColor = ['red', 'yellow', 'blue', 'orange', 'lightgreen', 'green', 'lightred', 'red'];
const Traslados = (props) => {
    const [loading, setLoading] = useState(true);
    const [traslados, setTraslados] = useState([]);
    const [centroId, setCentroId] = useState(props.route.params.centroId ? props.route.params.centroId:(props.dataUser.Centros?.length === 1 ? props.dataUser.Centros[0].WERKS:null));
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? [...prev, {label: d.NAME1, value: d.WERKS}]:prev,[]):[]);
    const [centros, setCentros] = useState([]);
    const [centrosHacia, setCentrosHacia] = useState([]);
    const [centroIdA, setCentroIdA] = useState(null);
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);
    const [almacenesA, setAlmacenesA] = useState([]);
    const [almacenIdA, setAlmacenIdA] = useState(null);
    const [nameTras, setNameTras] = useState('');
    const [filtrado, setFiltrado] = useState(10);
    const [showCrear, setShowCrear] = useState(false);
    const [modalPallet, setModalPallet] = useState(null);
    const [paletas, setPaletas] = useState(props.route.params.Paletas || []);

    /*useEffect( () =>{
        console.log("INIT SCANNER RECEIVED");

        async function hola() {
            console.log(await ScannerReceiver.getReferrerData());
            console.log(await ScannerReceiver.createCalendarEvent("hola", "Caracas"))
        }

        hola();
        //let retorname = await ScannerReceiver.createCalendarEvent('testName', 'testLocation');
        
        //console.log(retorname);
        let emitter = DeviceEventEmitter.addListener('ScannerBroadcastReceiver', function (map) {
            console.log('Scanner content is: ', map.referrer);
        });

        console.log(emitter);

        return () => {
            console.log("unmount")
            emitter.remove();
            //DeviceEventEmitter.removeAllListeners();
            //DeviceEventEmitter.removeListener('ScannerBroadcastReceiver'); 
        }
    },[]);*/

    useEffect(() => {
        // Lo deshabilitamos porque no se puede traer desde el usuario todos los almacenes solo los registrados
        /*if(props.dataUser.USSCO.indexOf('ALLSEDE') !== -1) {
            setCentros(props.dataUser.Centros);
            setCentrosHacia(props.dataUser.Centros.reduce((prev, d) => d.WERKS == centroId ? prev:[...prev, {label: d.NAME1, value: d.WERKS}],[]))
        } else {*/
        if(!centros.length) {
            console.log("HOLA CENTROS", centros.length)
            getCentros();
        }
        //}
    },[]);

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
            setAlmacenId(props.route.params.almacenId ? props.route.params.almacenId:null);
            setTraslados([]);
            if(centros.length) {
                setCentrosHacia(centros.reduce((prev, d) => d.WERKS == centroId ? prev:[...prev, {label: d.NAME1, value: d.WERKS}],[]))
                setCentroIdA(null);
            }
        }
    }, [centroId]);

    useEffect(() => {
        if(centroIdA) {
            let almacenesAux = [];
            for(let centro of centros) {
                if(centro.WERKS === centroIdA) {
                    almacenesAux = centro.Almacenes?.reduce((prev, al) => [...prev, {label: al.LGOBE, value: al.LGORT}], []);
                    break;
                }
            }
            console.log(almacenesAux);
            setAlmacenesA(almacenesAux);
            setAlmacenIdA(null);
        }
    }, [centroIdA]);

    useEffect(() => {
        if(centroId && almacenId) 
            getTraslados();
    }, [almacenId, filtrado]);

    async function getTraslados() {
        let datos = [
            `IDPAL=${props.route.params.IDPAL}`,
            `find={"FWERK": "${centroId}", "FLGOR": "${almacenId}", "TRSTS": "[1,2,3,5]"}`
        ];
        if(filtrado !== -1) {
            datos.push(`limit=${filtrado}`);
        }
        setLoading(true);
        setTraslados([]);
        fetchIvan(props.ipSelect).get('/crudTraslados', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log("Traslados: ", props.route.params);
            setTraslados(data.data);
        })
        .catch(({status, error}) => {
            console.log(error);
            /*if(status === 401 && error.text.indexOf("autorización") !== -1) {
                //props.navigation.popToTop();
                props.navigation.navigate('Login', {hola : true});
            }*/
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.SHORT
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    async function getCentros() {
        setLoading(true);
        fetchIvan(props.ipSelect).get('/Centros', "", props.token.token)
        .then(({data}) => {
            console.log("Centros y almacenes: ", data.data.length);
            setCentros(data.data);
            setCentrosHacia(data.data.reduce((prev, d) => d.WERKS == centroId ? prev:[...prev, {label: d.NAME1, value: d.WERKS}],[]))
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
    }

    const crearTraslado = () => {
        let datos = {
            create: {
                TRCON: nameTras,
                FWERK: centroId,
                TWERK: centroIdA,
                FLGOR: almacenId,
                TLGOR: almacenIdA,
                TRSTS: 1
            },
            IDPAL: props.route.params.IDPAL
        }
        setLoading(true);
        fetchIvan(props.ipSelect).post('/crudTraslados', datos, props.token.token)
        .then(({data}) => {
            console.log("Traslado creado: ", data.data);
            data.data.CreadoPor = {
                IDUSRentity: props.dataUser.IDUSRentity,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor = data.data.CreadoPor;
            data.data.DesdeCentro = centros.filter(s => s.WERKS === centroId)[0];
            data.data.HaciaCentro = centros.filter(s => s.WERKS === centroIdA)[0];
            setTraslados([data.data, ...traslados]);
            setNameTras("");
            setCentroIdA(null);
            let PaletAux = JSON.parse(JSON.stringify(paletas));
            for(let i=0; i < PaletAux.length; i++) {
                if(PaletAux[i].IDPAL === props.route.params.IDPAL) {
                    PaletAux[i].PaleticaTras.push({IDPAL: PaletAux[i].IDPAL, IDTRA:  data.data.IDTRA});
                    props.route.params.setPaletas(PaletAux);
                    setPaletas(PaletAux);
                    break;
                }
            }
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
    }

    const dropTraslado = (name, id) => {
        Alert.alert('Confirmar', `¿Deseas eliminar el traslado (${name}) realmente?`, [
        {
          text: 'Sí, deseo eliminar',
          style: 'destructive',
          onPress: () => {
            let datos = {
                id: id,
                update: {
                    TRSTS: 0
                }
            };

            setLoading(true);
            fetchIvan(props.ipSelect).put('/crudTraslados', datos, props.token.token)
            .then(({data}) => {
                console.log("Traslado eliminado: ", data.data);
                let newTras = JSON.parse(JSON.stringify(traslados));
                setTraslados(newTras.filter(t => t.IDTRA != id));
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

    const updateTras = (trasladish) => {
        let auxTraslados = JSON.parse(JSON.stringify(traslados));
        auxTraslados.map((t,k)=>{
            if(t.IDTRA === trasladish.IDTRA) {
                auxTraslados[k] = trasladish;
            }
        });
        setTraslados(auxTraslados);
        console.log("Traslado actualizados");
    }

    const ampliarTraslado = async (IDPAL, IDTRA, asociar) => {
        console.log(IDPAL, IDTRA, asociar);
        let PaletAux = JSON.parse(JSON.stringify(paletas));
        const datos = {
            IDPAL: IDPAL,
            IDTRA: IDTRA
        };
        for(let i=0; i < PaletAux.length; i++) {
            if(PaletAux[i].IDPAL === IDPAL) {
                if(asociar) {
                    PaletAux[i].PaleticaTras.push({IDPAL: IDPAL, IDTRA: IDTRA, loading: true});
                    setPaletas(PaletAux);
                    setLoading(true);
                    fetchIvan(props.ipSelect).post('/paletasTras', datos, props.token.token)
                    .then(({data}) => {
                        console.log("Paleta traslado asociado: ", data.data);
                        PaletAux[i].PaleticaTras[PaletAux[i].PaleticaTras.length-1] = {...data.data, loading: false};
                        console.log(PaletAux[i].PaleticaTras[PaletAux[i].PaleticaTras.length-1]);
                    })
                    .catch(({status, error}) => {
                        console.log(error);
                        PaletAux[i].PaleticaTras = PaletAux[i].PaleticaTras.filter((p) => p.IDTRA !== IDTRA);
                        return ToastAndroid.show(
                            error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                            ToastAndroid.SHORT
                        );
                    })
                    .finally(() => {
                        props.route.params.setPaletas(PaletAux);
                        setLoading(false);
                        setPaletas(PaletAux);
                    });
                    break;
                } else {
                    PaletAux[i].PaleticaTras.map((p) => p.IDTRA === IDTRA ? p.loading = true:'');
                    setPaletas(PaletAux);
                    setLoading(true);
                    fetchIvan(props.ipSelect).delete('/paletasTras', datos, props.token.token)
                    .then(({data}) => {
                        console.log("Paleta traslado eliminado: ", data.data);
                        PaletAux[i].PaleticaTras = PaletAux[i].PaleticaTras.filter((p) => p.IDTRA !== IDTRA);
                        
                    })
                    .catch(({status, error}) => {
                        console.log(error);
                        PaletAux[i].PaleticaTras.map((p) => p.IDTRA === IDTRA ? p.loading = false:'');
                        return ToastAndroid.show(
                            error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                            ToastAndroid.SHORT
                        );
                    })
                    .finally(() => {
                        console.log(PaletAux[i].PaleticaTras, IDTRA);
                        props.route.params.setPaletas(PaletAux);
                        setLoading(false);
                        setPaletas(PaletAux);
                    });
                    break;
                }
            }
        }
    }
    
    return (
        <Provider>
            <Stack spacing={1} style={{ margin: 5 }}>
                <View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                    
                    <SelectInput
                        searchable={true}
                        data={centrosUser}
                        value={centroId}
                        setValue={setCentroId}
                        title="Sucursal Origen"
                        buttonStyle={{maxWidth: '70%', padding: 3}}
                        disabled={props.route.params.centroId ? true:false}
                    />
                    {!centrosUser.length && <Text style={{fontWeight: '500'}}>No tienes centros asignados</Text>}
                </View>
            
                {centroId && almacenes.length ?<View style={styles.centros}>
                    <Text style={{fontWeight: '500'}}>División: </Text>
                    <SelectInput
                        searchable={true}
                        data={almacenes}
                        value={almacenId}
                        setValue={setAlmacenId}
                        title="División origen"
                        buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                        disabled={props.route.params.almacenId ? true:false}
                    />
                </View>:''}
                
                <ScrollView nestedScrollEnabled={true}  style={styles.scrollView}>
                    {props.dataUser.USSCO.indexOf('TRASLADOS_NEW') !== -1 && props.route.params.STSOR === 1 ?
                    <Button style={styles.title1} title="Crear traslado" color="white" tintColor={Global.colorMundoTotal} onPress={() => setShowCrear(!showCrear)}
                        leading={props => <MaterialCommunityIcons name={showCrear ? "menu-down":"menu-right"} {...props} size={24}/> } />:'' }
                    {props.dataUser.USSCO.indexOf('TRASLADOS_NEW') !== -1 && showCrear && props.route.params.STSOR === 1 ?  
                    <Box style={styles.box}>
                        <TextInput 
                            variant="standard" 
                            placeholder="Concepto de traslado"
                            value={nameTras}
                            onChangeText={(text) => setNameTras(text)}
                            maxLength={32}></TextInput>
                        <Text style={styles.subtitle}>Sucursal origen: {props.dataUser.Centros.length === 1 ? props.dataUser.Centros[0].NAME1:centrosUser?.filter(s => s.value == centroId)[0]?.label}{almacenId ? '('+almacenes.filter(al => al.value === almacenId)[0]?.label+')':''}</Text>
                        <Text style={styles.subtitle}>Sucursal destino: {centroIdA ? centrosHacia?.filter(s => s.value == centroIdA)[0]?.label:''}{almacenIdA ? '('+almacenesA.filter(al => al.value === almacenIdA)[0]?.label+')':''}</Text>
                        <HStack style={{justifyContent: 'space-between'}}>
                            <SelectInput
                                searchable={true}
                                data={centrosHacia}
                                value={centroIdA}
                                setValue={setCentroIdA}
                                title="Sucursal Destino"
                                buttonStyle={{width: '49%'}}
                            />
                            {centroIdA && almacenesA.length && <SelectInput
                                    searchable={true}
                                    data={almacenesA}
                                    value={almacenIdA}
                                    setValue={setAlmacenIdA}
                                    title="División destino"
                                    buttonStyle={{width: '49%'}}
                                />}
                        </HStack>
                        <Button loading={loading}
                            title="Crear" 
                            color="secondary" 
                            onPress={crearTraslado}
                            disabled={!nameTras.length || loading || !almacenId || !almacenIdA}
                            style={{marginTop: 5, zIndex: -1}}/>
                    </Box>:''}
                    <Stack style={styles.scrollView}>
                        <HStack style={{justifyContent: 'space-between', margin: 5}}>
                            <Text style={styles.title1}>Paleta: {props.route.params.IDPAL.substr(-3).padStart(3, '0')}</Text>
                            {/*props.dataUser.USSCO.indexOf('TRASLADOS_NEW') !== -1 && <Button leading={loading}
                                title="Imprimir QR de paleta"
                                color={Global.colorMundoTotal}
                                uppercase={false}
                            />*/}
                        </HStack>
                        <HStack style={{justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 5}}>
                            <Text>{"Lista de traslados\n"}<Text style={styles.subtitle}>Origen: {centrosUser.filter(center => center.value === centroId)[0]?.label}</Text></Text>
                            <SelectInput
                                data={[{label: '10', value: 10},{label: '25', value: 25},{label: '50', value: 50},{label: '100', value: 100},{label: 'Todos', value: -1}]}
                                value={filtrado}
                                setValue={setFiltrado}
                                title=""
                            />
                        </HStack>
                        {traslados.map((tras, i) => 
                            <ListItem
                                key={i}
                                overline={trasladosStatus[tras.TRSTS]}
                                title={tras.TRCON}
                                //secondaryText={"Destino: "+tras.HaciaCentro?.NAME1+" ("+tras.HaciaCentro?.Almacenes[0]?.LGOBE+")\n"+tras.TRAUP?.substr(0,16).replace("T"," ")}
                                secondaryText={"Origen: "+tras.DesdeCentro?.NAME1+" ("+tras.DesdeCentro?.Almacenes[0]?.LGOBE+")\n"+"Destino: "+tras.HaciaCentro?.NAME1+" ("+tras.HaciaCentro?.Almacenes[0]?.LGOBE+")\n"+tras.TRAUP?.substr(0,16).replace("T"," ")}
                                leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[tras.TRSTS]} color={trasStatusColor[tras.TRSTS]} style={{borderRadius: 12}} />}
                                trailing={(p2) => 
                                    <View>
                                        {props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && (tras.TRSTS < 3) && props.route.params.STSOR < 2 ? 
                                        <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(tras.TRCON, tras.IDTRA)}/>:''}
                                        {props.dataUser.USSCO.indexOf('TRASLADOS_UPD') !== -1 && (tras.TRSTS < 3) && props.route.params.STSOR < 2 ?
                                        <IconButton icon={p2=p2 => <MaterialCommunityIcons name="folder-move" {...p2}/> } onPress={() => setModalPallet(tras)} />:''}
                                    </View>
                                }
                                onPress={() => props.dataUser.USSCO.indexOf('SCAN') !== -1 ? props.navigation.navigate('Scaneo', {
                                    traslado: tras,
                                    updateTras: updateTras
                                }):''}
                            />
                        )}
                        {!traslados.length && <Text>No hay traslados creados</Text>}
                    </Stack>
                    <View style={{ width: 200, height: 80 }}></View>
                </ScrollView>
                {loading && <ActivityIndicator />}
                <Dialog visible={modalPallet !== null} onDismiss={() => setModalPallet(null)}>
                    <DialogHeader title="Ampliar Traslado" />
                    <DialogContent>
                        <Text>Indica donde quieres que esté ampliado este traslado.</Text>
                        <ScrollView style={{height: 250}}>
                        {modalPallet?.IDTRA && paletas.map((pal, idx) => {
                            let filter = pal.PaleticaTras.filter(p => p.IDTRA === modalPallet.IDTRA)[0] || {};
                            let count = paletas.reduce((prev, p1) => p1.PaleticaTras.filter(p => p.IDTRA === modalPallet.IDTRA && !p.loading).length ? prev+1:prev, 0);
                            //console.log(count)
                            return(
                                <ListItem
                                    key={idx}
                                    title={"Paleta: "+pal.IDPAL.substr(-3).padStart(3, '0')}
                                    trailing={
                                        filter.loading === true ? 
                                            <ActivityIndicator />:
                                            <Switch disabled={count <= 1 && filter.IDTRA ? true:false} value={filter.IDPAL ? true:false} onValueChange={() => ampliarTraslado(pal.IDPAL, modalPallet.IDTRA, filter.IDPAL ? false:true)} />
                                    }
                                    onPress={() => (count <= 1 && filter.IDTRA ? false:true) && !filter.loading && ampliarTraslado(pal.IDPAL, modalPallet.IDTRA, filter.IDPAL ? false:true)}
                                />)   
                            }
                        )}
                        </ScrollView>
                    </DialogContent>

                    <DialogActions>
                        <Button
                            title="Listo"
                            compact
                            variant="text"
                            onPress={() => setModalPallet(null)}
                        />
                    </DialogActions>
                </Dialog>
            </Stack>
        </Provider>

    )
}

export default memo(Traslados);

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