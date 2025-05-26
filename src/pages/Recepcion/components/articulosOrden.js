import { memo, useEffect, useState } from "react";
import fetchIvan from "../../../components/_fetch";
import { FlatList, RefreshControl, StyleSheet, ToastAndroid, View } from "react-native";
import { Button, HStack, ListItem, Stack, Text, TextInput, VStack } from "@react-native-material/core";
import ModalShow from "../../../components/_modal";

import _ from 'lodash';

const ArticulosOrden = memo((props) => {
    const {recepcion, scan, ordenCompra, getOrdenCompra} = props;

    //const [ordenCompra, setOrdenCompra] = useState({});
    const [loading, setLoading] = useState(false);
    const [buscar, setBuscar] = useState('');

    useEffect(() => {
        if(props.show)
            getOrdenCompra();
    }, [props.show]);


    /*function getOrdenCompra() {
        let datos = [
            `EBELN=${recepcion.EBELN}`,
            `RECEPCION=${recepcion.IDREC}`,
            `WERKS=${recepcion.WERKS}`,
            `LGORT=${recepcion.LGORT}`
        ];
        setOrdenCompra({});
        setLoading(true);
        fetchIvan(props.ipSelect).get('/administrative/getOrdenCompra', datos.join('&'), props.token.token)
        .then(({data}) => {
            setOrdenCompra(data.data);
            console.log(data.data);
        })
        .catch(({status, error}) => {
            console.log(status, error);
            return ToastAndroid.show(
                error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.LONG
            );
        })
        .finally(() => {
            setLoading(false);
        });
    }*/

    const rowList = ({item, index}) => {
        return (
            <ListItem 
                key={index} 
                title={<Text style={{backgroundColor: scan === item.MATNR ? 'yellow':'transparent'}}>{item.TXZ01}</Text>} 
                //title={item.TXZ01}
                
                secondaryText={
                    `${item.MATNR}`
                    +(item.PedidosCompraProductosDetalle.CHARG?.length > 1 ? 
                        `\nLote: ${item.PedidosCompraProductosDetalle.CHARG}`:'')
                }
                trailing={
                    <VStack style={styles.item}>
                        <VStack style={styles.item2}>
                            <Text style={{fontSize: 14, fontWeight: 'bold'}} numberOfLines={1}>{recepcion.RESTS !== 'CREADO' ? (item.MENGE*item.UMREZ):item.CANT_FINAL}</Text>
                            <Text style={{fontSize: 11}} numberOfLines={1}>Und.</Text>
                        </VStack>
                        <VStack style={styles.item2}>
                            <Text style={{fontSize: 14, fontWeight: 'bold'}} numberOfLines={1}>{item.COUNT_SCAN ?? 0}</Text>
                            <Text style={{fontSize: 11, color: !item.COUNT_SCAN ? 'red':(item.COUNT_SCAN == (recepcion.RESTS !== 'CREADO' ? (item.MENGE*item.UMREZ):item.CANT_FINAL) ? 'green':'orange')}} numberOfLines={1}>Scan</Text>
                        </VStack>
                    </VStack>
                }
            />
        )
    }

    return (
        <ModalShow show={props.show} setShow={props.setShow} title={"Orden de compra nº: "+recepcion.EBELN+"\nProveedor: "+recepcion.ProveedoresFijo?.Proveedor?.NAME1 ?? recepcion.LIFNR ?? ''} >
            
            <FlatList
                data={ordenCompra?.PedidosCompraProductos ? !buscar?.length ? ordenCompra.PedidosCompraProductos:ordenCompra?.PedidosCompraProductos.filter(f => f.TXZ01.indexOf(buscar) !== -1 || f.MATNR.indexOf(buscar) !== -1):[]}
                renderItem={rowList}
                initialNumToRender={10}
                ListHeaderComponent={
                    <Stack>
                        <Stack bg={"lightgrey"}>
                            <Text style={{textAlign: 'center', fontWeight: '600'}}>Lista de artículos esperados</Text>
                            <HStack style={{justifyContent: 'space-around'}}>
                                <Text style={styles.title3}>Total art: <Text style={styles.subtitle}>{ordenCompra?.PedidosCompraProductos?.length ?? 0}</Text></Text>
                                <Text style={styles.title3}>Total unds: 
                                    <Text style={styles.subtitle}>
                                        {ordenCompra?.PedidosCompraProductos ? 
                                            ordenCompra?.PedidosCompraProductos.reduce((prev, prod) => prev+parseInt((recepcion.RESTS !== 'CREADO' ? (prod.MENGE*prod.UMREZ):prod.CANT_FINAL) || 0), 0)
                                            :0}
                                    </Text>
                                </Text>
                            </HStack>
                        </Stack>

                        <TextInput 
                            value={buscar}
                            onChangeText={(t) => setBuscar(t.toUpperCase())} 
                            placeholder="Buscar..."
                            style={{padding: 10}}
                        />
                    </Stack>
                }
                loading={loading}
                refreshControl={<RefreshControl onRefresh={getOrdenCompra} refreshing={loading}/>}
            />
            <Button title="Cerrar" color="grey" onPress={() => props.setShow(false)} style={{alignSelf: 'center', marginTop: 20}}/>
        </ModalShow>
    )
},(prevProps, nextProps) => {
    if(_.isEqual(prevProps.recepcion, nextProps.recepcion) && prevProps.show === nextProps.show && prevProps.scan === nextProps.scan && _.isEqual(prevProps.ordenCompra, nextProps.ordenCompra)) {
        return true; // props are equal
    }
    return false; // props are not equal -> update the component
});

export default ArticulosOrden;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#add8e6', // Color de fondo del contenedor
        borderRadius: 4,
        overflow: 'hidden',
    },
    item: {
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        width: 75, 
        height: 75,
        flexWrap: 'nowrap',
        padding: 2
    },
    item2: {
        borderBottomWidth: 1,
        borderBottomColor: 'lightgrey',
        alignItems: 'center', 
        textAlign: 'center', 
    },
    title3: {
        zIndex: 9,
        fontSize: 14,
        fontWeight: '500'
    },
    subtitle: {
        fontSize: 13,
    },
});