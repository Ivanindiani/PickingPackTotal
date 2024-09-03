import { View, useWindowDimensions, StyleSheet, ToastAndroid, Alert, ScrollView } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import FindProducts from './Almacen/FindProducts';
import ManagerProducts from './Almacen/ManagerProducts';
import FindByBodega from './Almacen/FindByBodega';
import { useState, useEffect } from 'react';
import { Text } from '@react-native-material/core';
import SelectInput from '../components/_virtualSelect';
import MoveProducts from './Almacen/MoveProducts';
import fetchIvan from '../components/_fetch';

const Global = require('../../app.json');

const AlmacenInv = (props) => {
    
    const layout = useWindowDimensions();

    const [index, setIndex] = useState(0);
    const [routes, setRoutes] = useState([
        { key: 'find', title: 'Buscar\nProductos' }
    ]);
    const [bodega, setBodega] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(props.dataUser.USSCO?.indexOf('INSERT_ARTBODEGA') !== -1 && props.dataUser.USSCO?.indexOf('MOVE_ARTBODEGA') === -1) {
            setRoutes([
                { key: 'find', title: 'Buscar\nProductos' }, 
                { key: 'manager', title: 'Agregar\nProductos' }, 
                { key: 'bodega', title: 'Buscar\npor QR' }
            ])
        } else if(props.dataUser.USSCO?.indexOf('INSERT_ARTBODEGA') !== -1 && props.dataUser.USSCO?.indexOf('MOVE_ARTBODEGA') !== -1) {
            setRoutes([
                { key: 'find', title: 'Buscar\nProductos' }, 
                { key: 'manager', title: 'Agregar\nProductos' }, 
                { key: 'mover', title: 'Mover\nProductos' }, 
                { key: 'bodega', title: 'Buscar\npor QR' }
            ])
        }
    },[]);
    
    const _renderScene = ({ route }) => {
        switch(route.key) {
            case 'find':
                return <FindProducts {...props} almacenId={almacenId} centroId={centroId} tabActive={index===0} bodega={bodega}/>
            case 'manager':
                return <ManagerProducts {...props} almacenId={almacenId} centroId={centroId} tabActive={index===1}  bodega={bodega}/>;
            case 'mover':
                return <MoveProducts {...props} almacenId={almacenId} centroId={centroId} tabActive={index===2}  bodega={bodega}/>;
            case 'bodega':
                return <FindByBodega {...props} almacenId={almacenId} centroId={centroId} tabActive={index===3}  bodega={bodega}/>;
        }
    }

    const [centroId, setCentroId] = useState(props.dataUser.Centros?.length === 1 ? props.dataUser.Centros[0].WERKS:null);
    const [centrosUser] = useState(props.dataUser.Centros?.length ? props.dataUser.Centros.reduce((prev, d) => props.dataUser.Restringe?.indexOf(d.WERKS) !== -1 ? [...prev, {label: d.NAME1, value: d.WERKS}]:prev,[]):[]);
    const [almacenes, setAlmacenes] = useState([]);
    const [almacenId, setAlmacenId] = useState(null);

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
        if(almacenId) {
            setBodega({});
            setLoading(true);
            let datos = [
                `WERKS=${centroId}`,
                `LGORT=${almacenId}`
            ]
            fetchIvan(props.ipSelect).get('/administrative/crudBodegas', datos.join('&'), props.token.token)
            .then(({data}) => {
                console.log(data.extra);
                if(!data.data.length) {
                    return Alert.alert("Error", "La bodega seleccionada aún no está estructurada, por favor contacta a sistemas.")
                }
                setBodega(data);
            }).catch(({status, error}) => {
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
    }, [almacenId]);

    return (
        <ScrollView contentContainerStyle={{flex: 1}} nestedScrollEnabled={true}>
            <View style={styles.centros}>
                <Text style={{fontWeight: '500'}}>Sucursal: </Text>
                <SelectInput
                    searchable={false}
                    data={centrosUser}
                    value={centroId}
                    setValue={setCentroId}
                    title="Sucursal Origen"
                    buttonStyle={{maxWidth: '70%', padding: 3}}
                    autoFocus={false}
                />
                {!centrosUser.length ? <Text style={{fontWeight: '500'}}>No tienes centros asignados</Text>:''}
            </View>
        
            {centroId && almacenes.length ?
            <View style={styles.centros}>
                <Text style={{fontWeight: '500'}}>División: </Text>
                <SelectInput
                    searchable={false}
                    data={almacenes}
                    value={almacenId}
                    setValue={setAlmacenId}
                    title="División origen"
                    buttonStyle={{maxWidth: '70%', alignSelf: 'flex-end'}}
                    autoFocus={false}
                />
            </View>:''}
            
            <TabView
                navigationState={{ index, routes }}
                renderScene={_renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={props => <TabBar {...props} style={{backgroundColor: Global.colorMundoTotal}} labelStyle={{fontSize: 8.6, padding: 0}}/>} // <-- add this line
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    title1: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    centros: {
        width: "99%",
        //alignSelf: 'flex-end',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: 3,
        padding: 1
    },
});

export default AlmacenInv;