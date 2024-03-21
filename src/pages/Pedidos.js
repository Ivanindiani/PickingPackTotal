import { ListItem, Provider, Stack, Text } from "@react-native-material/core";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, ToastAndroid, View } from "react-native";
import fetchIvan from "../components/_fetch";
import ListaPerform from "../components/_virtualList";

const Pedidos = (props, ref) => {
    const traslado = props.route.params.traslado;
    const IDPAL = props.route.params.IDPAL;
    const [loading, setLoading] = useState(false);
    const pedido = props.pedido;
    const [msgConexion, setMsgConex] = useState('');

    useImperativeHandle(ref, () => ({
        getItems: () => getItems(),
    }));

    useEffect(() => {
        getItems();
    }, []);

    function getItems(show=true) {
        return new Promise((resolve) => {
            let datos = [
                `IDPED=${traslado.IDPED}`,
                `IDTRA=${traslado.IDTRA}`,
                `WERKS=${traslado.FWERK}`,
                `LGORT=${traslado.FLGOR}`,
                `IDPAL=${IDPAL}`,
                `simpleData=true`
            ];
            
            setLoading(true);
            fetchIvan(props.ipSelect).get('/trasladosItemsBodega', datos.join('&'), props.token.token, undefined, undefined, 60000) // 1 minuto para probar
            .then(({data}) => {
                props.setPedido(data.data);
                
                resolve(data.data);
                if(show)
                    ToastAndroid.show("Productos del pedido listado correctamente", ToastAndroid.SHORT)
            })
            .catch(({status, error}) => {
                //console.log(error);
                if(error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1) {
                    setMsgConex("¡Ups! Parece que no hay conexión a internet");
                }
                ToastAndroid.show(
                    error?.text || error?.message || (error && typeof(error) !== 'object' && error.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.SHORT
                );
                resolve(false);
            })
            .finally(() => {
                setLoading(false);
            });
        });
    }

    const getDisponible = (item) => {
        let cantDisponible = item.UnidadBase.XCHPF === 'X' ? parseFloat(item.ProdConLote?.CLABS ?? 0):parseFloat(item.ProdSinLote?.LABST ?? 0);
        cantDisponible -= parseFloat(item.RESERVADOS ?? 0);
        return cantDisponible;
    }

    const getUbicaciones = (item) => {
        let text = ``;
        for(let art of item.ArticulosBodegas) {
            if(text.length)
                text += " | ["+art.Bodega.FLOOR+"-"+art.Bodega.AISLE+"-"+art.Bodega.COLUM+"-"+art.Bodega.RACKS+"-"+art.Bodega.PALET+"] stock: "+(art.QUANT-(traslado.TRSTS === 1 ? (art.RESERVADOS??0):0));
            else
                text += "["+art.Bodega.FLOOR+"-"+art.Bodega.AISLE+"-"+art.Bodega.COLUM+"-"+art.Bodega.RACKS+"-"+art.Bodega.PALET+"] stock: "+(art.QUANT-(traslado.TRSTS === 1 ? (art.RESERVADOS??0):0));
        }
        if(!text.length) {
            return <Text style={styles.ubicaciones}>No encontramos ubicación registrada del artículo</Text>;
        }
        return <Text style={styles.ubicaciones2}>{text}</Text>;
    }

    const rows = (item, index) => 
    <ListItem
        style={{backgroundColor:'black'}}
        key={index}
        overline={<Text style={styles.overlay}>Cant. Requerida: <Text style={[styles.overlay, {fontWeight: 'bold', fontSize: 12}]}>{item.CANTP}</Text> | Total Escaneado: <Text style={[styles.overlay, {fontWeight: 'bold', fontSize: 12}]}>{item.ESCANEADO ?? 0}</Text>
                    {"\n"}Usuario: {item.UsuarioAsignado.USNAM+" "+item.UsuarioAsignado.USLAS}</Text>}
        title={item.MAKTG}
        secondaryText={<Text style={styles.subtitle}>{item.Producto.MAKTG} {item.UnidadBase.XCHPF === 'X' ? <Text style={styles.lote}>{"\n"}LOTE: {item.CHARG}</Text>:''}
            {traslado.TRSTS === 1 ? `\nCant. Max. Disponible: ${getDisponible(item)}\n`:''}
        {traslado.TRSTS === 1 ? getUbicaciones(item):''}</Text>}
    />

    return (
        <Provider>
            <View style={{margin: 2, flex: 1, width: '100%' }}>
                {!loading && msgConexion ? <Text style={{padding: 3, backgroundColor: 'red', color: 'white', textAlign: 'center', fontSize: 12}}>{msgConexion}</Text>:''}
                <ListaPerform
                    items={pedido}
                    renderItems={rows}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={getItems}/>}
                    height={traslado.TRSTS === 1 ? 106:92}
                    forceHeight={false}
                />
            </View>
        </Provider>)
}

export default forwardRef(Pedidos);


const styles = StyleSheet.create({
    subtitle: {
        fontSize: 12,
    },
    overlay: {
        fontSize: 11,
        color: 'grey'
    },
    ubicaciones: {
        fontSize: 11,
        color: 'red'
    },
    ubicaciones2: {
        fontSize: 12,
        backgroundColor: 'yellow',
        fontWeight: 500,
        padding: 10
    },
    lote: {
        fontSize: 12,
        fontWeight: 'bold'
    }
});