import { useState, useEffect } from "react";
import { ActivityIndicator, Box, HStack, ListItem, Stack, Text } from "@react-native-material/core";
import { ScrollView, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import SelectInput from "../components/_virtualSelect";
import Entypo from "react-native-vector-icons/Entypo";

const trasladosStatus = ['Eliminado', 'En progreso', 'En Tránsito, en espera de SAP', 'En Tránsito, cargado en SAP', 'Recibido, en espera de TotalPost', 'Completado', 'Devuelto en espera de SAP', 'Devuelto'];
const trasStatusColor = ['red', 'yellow', 'blue', 'orange', 'lightgreen', 'green', 'lightred', 'red'];
const RecibirTraslados = (props) => {
    //console.log(props.dataUser.Centros);
    const [loading, setLoading] = useState(false);
    const [traslados, setTraslados] = useState([]);
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) =>  props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? prev:[...prev, {label: d.NAME1, value: d.WERKS}],[]):[]);
    const [centroId, setCentroId] = useState(props.route.params.centroId ? props.route.params.centroId:(centrosUser.length === 1 ? centrosUser[0].value:null));
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);
    const [filtrado, setFiltrado] = useState(10);

    useEffect(() => { // Change centro
        if(centroId) {
            let almacenesAux = [];
            for(let centro of props.dataUser.Centros) {
                if(centro.WERKS == centroId) {
                    almacenesAux = centro.Almacenes?.reduce((prev, al) => [...prev, {label: al.LGOBE, value: al.LGORT}], []);
                    break;
                }
            }
            console.log(almacenesAux, centroId);
            setAlmacenes(almacenesAux);
            setAlmacenId(props.route.params.almacenId ? props.route.params.almacenId:null);
            setTraslados([])
        }
    }, [centroId]);

    useEffect(() => {
        if(centroId && almacenId) 
            getTraslados();
    }, [almacenId, filtrado]);

    async function getTraslados() {
        let data = [
            `orden=true`,
            props.route.params.type_tras === 'crear_tras' ?
            `find={"FWERK": "${centroId}", "FLGOR": "${almacenId}", "TRSTS": "[1,2,3,4,5]"}`:
            `find={"TWERK": "${centroId}", "TLGOR": "${almacenId}", "TRSTS": "[1,2,3,4,5]"}`
        ]
        if(props.route.params.IDPAL) {
            data.push(`IDPAL=${props.route.params.IDPAL}`)
        }
        setLoading(true);
        setTraslados([]);
        fetchIvan(props.ipSelect).get('/crudTraslados', data.join('&'), props.token.token)
        .then(({data}) => {
            console.log("Recibir Traslados: ", data.data.length);
            setTraslados(data.data);
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

    return (

        <Stack spacing={1} style={{ margin: 5 }}>
            {!props.dataUser.CAMIONERO && 
            <View style={styles.centros}>
                <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                {centrosUser.length > 1 ?
                    <SelectInput
                        searchable={true}
                        data={centrosUser}
                        value={centroId}
                        setValue={setCentroId}
                        title="Sucursal Destino"
                        buttonStyle={{maxWidth: '70%', padding: 3}}
                    />:<Text style={{fontWeight: '500'}}>{centrosUser[0]?.label || "No tienes centros asignados"}</Text>
                }
            </View>}
            {!props.dataUser.CAMIONERO && centroId && almacenes.length ?
            <View style={styles.centros}>
                <Text style={{fontWeight: '500'}}>División: </Text>
                <SelectInput
                    searchable={false}
                    data={almacenes}
                    value={almacenId}
                    setValue={setAlmacenId}
                    title="División Destino"
                    buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                />
            </View>:''}
            <ScrollView nestedScrollEnabled={true}  style={styles.scrollView}>
                <Stack style={styles.scrollView} spacing={5}>
                    <HStack style={{justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <Text>{"Últimos traslados\n"}<Text style={styles.subtitle}>Destino: {centrosUser.filter(center => center.value === centroId)[0]?.label}</Text></Text>
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
                            title={tras.TRCON}
                            overline={trasladosStatus[tras.TRSTS]}
                            secondaryText={"Origen: "+tras.DesdeCentro?.NAME1+" ("+tras.DesdeCentro?.Almacenes[0]?.LGOBE+")\n"+tras.TRAUP?.substr(0,16).replace("T"," ")}
                            leading={<Entypo name="circle" size={24} backgroundColor={trasStatusColor[tras.TRSTS]} color={trasStatusColor[tras.TRSTS]} style={{borderRadius: 12}} />}
                            //trailing={p2 => props.dataUser.USSCO.indexOf('TRASLADOS_DEL') !== -1 && (tras.TRSTS < 3) && <IconButton icon={p2=p2 => <AntDesign name="delete" {...p2}/> } onPress={() => dropTraslado(tras.TRCON, tras.IDTRA)}/>}
                            onPress={() => props.dataUser.USSCO.indexOf('RECEIVE_TRAS') !== -1 ? props.navigation.navigate('VerItems', {
                                traslado: tras,
                                updateTras: updateTras
                            }):''}
                        />
                    )}
                    {!traslados.length && <Text>No hay traslados asignados</Text>}
                </Stack>
                <View style={{ width: 200, height: 80 }}></View>
            </ScrollView>
            {loading && <ActivityIndicator />}
        </Stack>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        marginTop: 10,
        zIndex: 9
    }, 
    centros: {
        width: "99%",
        //alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    box: {
        backgroundColor: "lightgrey",
        padding: 10,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5
    },
    subtitle: {
        fontSize: 13,
    },
})

export default RecibirTraslados;