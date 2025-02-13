import { ActivityIndicator, Box, Button, Dialog, DialogActions, DialogContent, DialogHeader, HStack, IconButton, ListItem, Provider, Stack, Switch, Text, TextInput, VStack } from "@react-native-material/core";
import { memo, useEffect, useState } from "react";
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, ToastAndroid, View, useWindowDimensions } from "react-native";
import fetchIvan from "../components/_fetch";
import Entypo from "react-native-vector-icons/Entypo";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import SelectInput from "../components/_virtualSelect";
import { TabBar, TabView } from "react-native-tab-view";
const Global = require("../../app.json");
//import { DeviceEventEmitter } from "react-native";

//import ScannerReceiver from "../components/_scannerModule";

const trasladosStatus = ['Eliminado', 'En progreso', 'En Tránsito, en espera de SAP', 'En Tránsito, cargado en SAP', 'Recibido, en espera de TotalPost', 'Completado', 'Devuelto en espera de SAP', 'Devuelto'];
const trasStatusColor = ['red', 'yellow', 'blue', 'orange', 'lightgreen', 'green', 'lightred', 'red'];
const Traslados = (props) => {
    const centroId = props.route.params.centroId;
    const almacenId = props.route.params.almacenId;
    const centroName = props.route.params.centroName;
    const almacenName = props.route.params.almacenName;

    const [loading, setLoading] = useState(true);
    const [traslados, setTraslados] = useState([]);
    const [pending, setPending] = useState([]);
    const [centros, setCentros] = useState([]);
    const [centrosHacia, setCentrosHacia] = useState([]);
    const [centroIdA, setCentroIdA] = useState(null);
    const [almacenesA, setAlmacenesA] = useState([]);
    const [almacenIdA, setAlmacenIdA] = useState(null);
    const [nameTras, setNameTras] = useState('');
    const [filtrado, setFiltrado] = useState(10);
    const [filtrado2, setFiltrado2] = useState(10);
    const [showCrear, setShowCrear] = useState(false);
    const [modalPallet, setModalPallet] = useState(null);
    const [paletas, setPaletas] = useState(props.route.params.Paletas ?? []);
    const [paleta, setPaleta] = useState(props.route.params.Paleta ?? {});

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
        let before = props.navigation.addListener('beforeRemove', (e) => {
            console.log("Mount listener info")
            if(modalPallet) {
                e.preventDefault();
                setModalPallet(null);
            }
        })

        return () => {
            console.log("Remove listener info");
            before();
        }
    }, [props.navigation, modalPallet]);

    useEffect(() => {
        // Lo deshabilitamos porque no se puede traer desde el usuario todos los almacenes solo los registrados
        /*if(props.dataUser.USSCO.split(',').indexOf('ALLSEDE') !== -1) {
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
        getTraslados();
    }, [filtrado]);

    useEffect(() => {
        if(props.route.params.STSOR === 1) {
            getPending();
        }
    }, [filtrado2]);

    async function getTraslados() {
        let datos = [
            `IDPAL=${props.route.params.IDPAL}`,
            `find={"FWERK": "${centroId}", "FLGOR": "${almacenId}", "TRSTS": "[1,2,3,5]"}`,
            `users_scan=true`
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
                ToastAndroid.LONG
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }

    async function getPending() {
        let datos = [
            `find={"FWERK": "${centroId}", "FLGOR": "${almacenId}", "TRSTS": "[1]"}`
        ];
        if(filtrado !== -1) {
            datos.push(`limit=${filtrado2}`);
        }
        setLoading(true);
        setPending([]);
        fetchIvan(props.ipSelect).get('/trasladosPending', datos.join('&'), props.token.token)
        .then(({data}) => {
            console.log("Traslados: ", props.route.params);
            setPending(data.data);
        })
        .catch(({status, error}) => {
            console.log(error);
            /*if(status === 401 && error.text.indexOf("autorización") !== -1) {
                //props.navigation.popToTop();
                props.navigation.navigate('Login', {hola : true});
            }*/
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.LONG
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
            setCentrosHacia(data.data.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 || d.WERKS == centroId ? prev:[...prev, {label: d.NAME1, value: d.WERKS}],[]))
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
                IDUSR: props.dataUser.IDUSR,
                USLAS: props.dataUser.USLAS,
                USNAM: props.dataUser.USNAM,
                USNAA: props.dataUser.USNAA,
            };
            data.data.ActualizadoPor = data.data.CreadoPor;
            data.data.PESO = 0;
            data.data.VOLUMEN = 0;
            data.data.DesdeCentro = centros.filter(s => s.WERKS === centroId)[0];
            data.data.HaciaCentro = centros.filter(s => s.WERKS === centroIdA)[0];
            setTraslados([data.data, ...traslados]);
            setShowCrear(false);
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
                ToastAndroid.LONG
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
                let newTras2 = JSON.parse(JSON.stringify(pending));
                setPending(newTras2.filter(t => t.IDTRA != id));
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
                        if(props.route.params.IDPAL === IDPAL) {
                            setTraslados([...traslados, modalPallet]);
                        }
                        setPending(pending.filter(p => p.IDTRA !== IDTRA));
                    })
                    .catch(({status, error}) => {
                        console.log(error, typeof(error));
                        PaletAux[i].PaleticaTras = PaletAux[i].PaleticaTras.filter((p) => p.IDTRA !== IDTRA);
                        console.log("hola")
                        return ToastAndroid.show(
                            error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                            ToastAndroid.LONG
                        );
                    })
                    .finally(() => {
                        console.log("Finally", PaletAux);
                        props.route.params.setPaletas(PaletAux);
                        setPaletas(PaletAux);
                        setLoading(false);
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
                        if(props.route.params.IDPAL === IDPAL) {
                            setTraslados(traslados.filter(t => t.IDTRA !== modalPallet.IDTRA));
                            let count = PaletAux.reduce((prev, p1) => p1.PaleticaTras.filter(p => p.IDTRA === modalPallet.IDTRA && !p.loading).length ? prev+1:prev, 0);
                            if(count === 0) {
                                setPending([...pending, modalPallet]);
                            }
                        }
                    })
                    .catch(({status, error}) => {
                        console.log(error);
                        PaletAux[i].PaleticaTras.map((p) => p.IDTRA === IDTRA ? p.loading = false:'');
                        return ToastAndroid.show(
                            error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                            ToastAndroid.LONG
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

    const TrasladosEnPaleta = () =>
        <FlatList
            data={traslados}
            ListHeaderComponent={
            <HStack style={{justifyContent: 'space-between', alignItems: 'flex-start'}} mt={5} mb={5}>
                <VStack border={0} p={2} spacing={4}>
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{fontSize: 11, fontWeight: '600'}}>Peso: {parseFloat(paleta.PESO??0).toFixed(2)} KG</Text>
                    </HStack>
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{fontSize: 11, fontWeight: '600'}}>Vol: {parseFloat(paleta.VOLUMEN??0).toFixed(2)} M3</Text>
                    </HStack>
                </VStack>
                {/*<VStack border={0} p={2} spacing={4}>
                    {paleta.WEIGH ?
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{fontSize: 11, fontWeight: '600'}}>Peso reportado: {parseFloat(paleta.WEIGH??0).toFixed(2)} KG</Text>
                    </HStack>:''}
                    {paleta.DISTX && paleta.DISTY && paleta.DISTZ ?
                    <HStack style={{justifyContent: 'space-between', alignItems: 'center'}}>
                        <Text style={{fontSize: 11, fontWeight: '600'}}>Volumen reportado: {parseFloat((paleta.DISTX*paleta.DISTY*paleta.DISTZ) ?? 0).toFixed(2)} M3</Text>
                    </HStack>:''}
                </VStack>*/}
                <SelectInput
                    data={[{label: '10', value: 10},{label: '25', value: 25},{label: '50', value: 50},{label: '100', value: 100},{label: 'Todos', value: -1}]}
                    value={filtrado}
                    setValue={setFiltrado}
                    title=""
                />
            </HStack>
            }
            renderItem={({item, index}) =>
                <ListItem
                    key={index}
                    overline={"#"+item.IDTRA+"\n"+trasladosStatus[item.TRSTS]}
                    title={item.TRCON}
                    secondaryText={"Destino: "+item.HaciaCentro?.NAME1+" ("+item.HaciaCentro?.WERKS+")\n"
                        +"Fecha Creación: "+item.DATEC?.substr(0,16)?.replace("T"," ")+"\n"
                        +"Fecha Contable: "+item.DATEU?.substr(0,16)?.replace("T"," ")+"\n"
                        +"Pedido Nº: "+(item.IDPED ?? "Traslado MANUAL")
                        +(item.TRSTS > 2 ? "\nNº Documento SAP: "+item.CodigosTraslado?.MBLNR:'')
                    //secondaryText={"Origen: "+item.DesdeCentro?.NAME1+" ("+item.DesdeCentro?.Almacenes[0]?.LGOBE+")\n"+"Destino: "+item.HaciaCentro?.NAME1+" ("+item.HaciaCentro?.Almacenes[0]?.LGOBE
                            //+")\n"+item.DATEU?.substr(0,16).replace("T"," ")
                            //+"\nAmpliado en: "+(item.Paletas.reduce((pr, pl) => (pr.length ? (pr+","):pr)+pl.IDPAL?.padStart(3, "0"), ""))
                        +`\nPeso: ${parseFloat(item.PESO??0).toFixed(2)} KG`
                        +`\nVolumen: ${parseFloat(item.VOLUMEN??0).toFixed(2)} M3`
                        }
                    leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[item.TRSTS]} color={trasStatusColor[item.TRSTS]} style={{borderRadius: 12}} />}
                    trailing={(p2) => 
                        <View>
                            {props.dataUser.USSCO.split(',').indexOf('TRASLADOS_DEL') !== -1 && (item.TRSTS < 3) && props.route.params.STSOR < 2 ? 
                            <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(item.TRCON, item.IDTRA)}/>:''}
                            {props.dataUser.USSCO.split(',').indexOf('ADMIN_PALLET') !== -1 && (item.TRSTS === 1) && props.route.params.STSOR < 2 ?
                            <IconButton icon={p2=p2 => <MaterialCommunityIcons name="folder-move" {...p2}/> } onPress={() => setModalPallet(item)} />:''}
                        </View>
                    }
                    onPress={() => props.dataUser.USSCO.split(',').indexOf('SCAN') !== -1 ? 
                    props.navigation.navigate(item.IDPED ? 'TabScaneo':'Scaneo', {
                        updatePaletas: (json) => {
                            setPaletas(json);
                            setPaleta(json.filter(f => f.IDPAL === props.route.params.IDPAL)[0]);
                            props.route.params.setPaletas(json)
                        },
                        Paletas: paletas,
                        Paleta: paleta,
                        IDPAL: props.route.params.IDPAL,
                        traslado: item,
                        updateTras: updateTras
                    }):''}
                />
            }
            ListEmptyComponent={<Text>No hay traslados creados</Text>}
            refreshControl={<RefreshControl refreshing={false} onRefresh={()=> getTraslados()}/>}
        />;

    const Pendientes = () => 
    <FlatList
        data={pending}
        ListHeaderComponent={
        <HStack style={{justifyContent: 'flex-end', alignItems: 'flex-start'}} mt={5} mb={5}>
            <SelectInput
                data={[{label: '10', value: 10},{label: '25', value: 25},{label: '50', value: 50},{label: '100', value: 100},{label: 'Todos', value: -1}]}
                value={filtrado2}
                setValue={setFiltrado2}
                title=""
            />
        </HStack>
        }
        renderItem={({item, index}) =>
            <ListItem
                key={index}
                overline={"#"+item.IDTRA+"\n"+trasladosStatus[item.TRSTS]}
                title={item.TRCON}
                secondaryText={"Destino: "+item.HaciaCentro?.NAME1+" ("+item.HaciaCentro?.WERKS+")\n"
                            +"Fecha Creación: "+item.DATEC?.substr(0,16)?.replace("T"," ")+"\n"
                            +"Pedido Nº: "+(item.IDPED ?? "Traslado MANUAL")}
                leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[item.TRSTS]} color={trasStatusColor[item.TRSTS]} style={{borderRadius: 12}} />}
                trailing={(p2) => 
                    <View>
                        {props.dataUser.USSCO.split(',').indexOf('TRASLADOS_DEL') !== -1 && (item.TRSTS < 3) && props.route.params.STSOR < 2 ? 
                        <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(item.TRCON, item.IDTRA)}/>:''}
                        {props.dataUser.USSCO.split(',').indexOf('TRASLADOS_UPD') !== -1 && (item.TRSTS < 3) && props.route.params.STSOR < 2 ?
                        <IconButton icon={p2=p2 => <MaterialCommunityIcons name="folder-move" {...p2}/> } onPress={() => setModalPallet(item)} />:''}
                    </View>
                }
            />
        }
        ListEmptyComponent={<Text>No hay pedidos pendientes</Text>}
        refreshControl={<RefreshControl refreshing={false} onRefresh={()=> getPending()}/>}
    />;

    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'paletas':
                return <TrasladosEnPaleta/>;
            case 'pendientes':
                return <Pendientes />;
        }
    }
    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes] = useState(props.route.params.STSOR === 1 ? [
        { key: 'paletas', title: 'Traslados en la paleta' },
        { key: 'pendientes', title: 'Traslados sin asignar' },
    ]:[{ key: 'paletas', title: 'Traslados en la paleta' }]);

    return (
        <Provider>
            <Stack spacing={1} style={{margin: 2, flex: 1 }}>
                <Text style={styles.subtitle}>Origen: {centroName+` (${almacenName})`}</Text>
                <Text style={styles.subtitle}>Ruta: {props.route.params.planed?.PNPLR ?? ''}</Text>
                <Text style={styles.subtitle}>Tiendas en ruta: {props.route.params.planed?.PJWER.tiendas.join(',') ?? ''}</Text>
                <Text style={styles.subtitle}>Pedidos asignados: {props.route.params.planed?.PJWER.pedidos?.join(',') ?? ''}</Text>

                {props.dataUser.USSCO.split(',').indexOf('TRASLADOS_NEW') !== -1 && props.route.params.STSOR === 1 ?
                <Button style={styles.title1} title="Crear traslado manual" color="white" tintColor={Global.colorMundoTotal} onPress={() => setShowCrear(!showCrear)}
                    leading={props => <MaterialCommunityIcons name={showCrear ? "menu-down":"menu-right"} {...props} size={24}/> } />:'' }

                {props.dataUser.USSCO.split(',').indexOf('TRASLADOS_NEW') !== -1 && showCrear && props.route.params.STSOR === 1 ?  
                <Box style={styles.box}>
                    <TextInput 
                        variant="standard" 
                        placeholder="Concepto de traslado"
                        value={nameTras}
                        onChangeText={(text) => setNameTras(text)}
                        maxLength={32}></TextInput>
                    <Text style={styles.subtitle}>Sucursal origen: {centroName+` (${almacenName})`}</Text>
                    
                    <Text style={styles.subtitle}>Sucursal destino: {centroIdA ? centrosHacia?.filter(s => s.value == centroIdA)[0]?.label:''}{almacenIdA ? '('+almacenesA.filter(al => al.value === almacenIdA)[0]?.label+')':''}</Text>
                    <HStack style={{justifyContent: 'space-between'}}>
                        <SelectInput
                            searchable={true}
                            data={centrosHacia.filter(f => props.route.params.planed?.PJWER.tiendas.indexOf(f.value) !== -1)}
                            value={centroIdA}
                            setValue={setCentroIdA}
                            title="Sucursal Destino"
                            buttonStyle={{width: '49%'}}
                        />
                        {centroIdA && almacenesA.length && <SelectInput
                                searchable={false}
                                data={almacenesA}
                                value={almacenIdA}
                                setValue={setAlmacenIdA}
                                title="División destino"
                                buttonStyle={{width: '49%'}}
                            />}
                    </HStack>
                    <Button loading={loading}
                        title="Crear" 
                        color={Global.colorMundoTotal} 
                        onPress={crearTraslado}
                        disabled={!nameTras.length || loading || !almacenId || !almacenIdA}
                        style={{marginTop: 5, zIndex: -1}}/>
                </Box>:''}
                
                <HStack style={{justifyContent: 'space-between', margin: 5}}>
                    <Text style={styles.title1}>Paleta: {props.route.params.IDPAL.substr(-3).padStart(3, '0')}</Text>
                    {/*props.dataUser.USSCO.split(',').indexOf('TRASLADOS_NEW') !== -1 && <Button leading={loading}
                        title="Imprimir QR de paleta"
                        color={Global.colorMundoTotal}
                        uppercase={false}
                    />*/}
                </HStack>
                
                <TabView
                    navigationState={{ index, routes }}
                    renderScene={_renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: layout.width }}
                    renderTabBar={props => <TabBar {...props} style={{backgroundColor: Global.colorMundoTotal}}/>} // <-- add this line
                />
                {loading && <ActivityIndicator />}
                <Dialog visible={modalPallet !== null} onDismiss={() => setModalPallet(null)}>
                    <DialogHeader title="Ampliar Traslado" />
                    <DialogContent>
                        <FlatList
                            data={modalPallet?.IDTRA ? paletas:[]}
                            ListHeaderComponent={<Text>Indica donde quieres que esté ampliado este traslado.</Text>}
                            renderItem={({item, index}) => {
                                let filter = item.PaleticaTras.filter(p => p.IDTRA === modalPallet.IDTRA)[0] || {};
                                return (<ListItem
                                    key={index}
                                    title={"Paleta: "+item.IDPAL.substr(-3).padStart(3, '0')}
                                    trailing={
                                        filter.loading === true ? 
                                            <ActivityIndicator />:
                                            <Switch value={filter.IDPAL ? true:false} onValueChange={() => ampliarTraslado(item.IDPAL, modalPallet.IDTRA, filter.IDPAL ? false:true)} />
                                    }
                                    onPress={() => !filter.loading && ampliarTraslado(item.IDPAL, modalPallet.IDTRA, filter.IDPAL ? false:true)}
                                />)
                            }}
                        />
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
    title1: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
    subtitle: {
        fontSize: 12,
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