import { Button, ListItem, Text } from "@react-native-material/core";
import { useState, memo } from "react";
import { FlatList, Modal, TextInput, StyleSheet, View } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import _ from 'lodash';

const SelectInput = memo((props) => {
    const [open, setOpen] = useState(props.open || false);
    const [find, setFind] = useState(null);

    return (
        open ? <Modal
            hardwareAccelerated={true}
            animationType="none"
            transparent={true}
            visible={open}
            onRequestClose={() => {
                setOpen(false);
                if(props.onClose)
                    props.onClose();
            }}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {props.title ? <Text style={styles.modalText}>{props.title}</Text>:''}
                    {props.searchable && <TextInput placeholder="Buscar" 
                        onChangeText={(text) => setFind(text) }
                        style={{margin: 10, marginTop: 2, borderBottomWidth: 1}}
                        autoFocus={false}
                    />}
                    <FlatList
                        data={find && props.searchable ? props.data.filter(f => f.value?.toString()?.toUpperCase().indexOf(find.toUpperCase()) !== -1 || f.label.toUpperCase().indexOf(find.toUpperCase()) !== -1):props.data}
                        renderItem={({item, index}) => <ListItem key={index} title={item.label} secondaryText={item.subLabel} onPress={() => { props.setValue(item.value); setOpen(false); if(props.onClose) {props.onClose();}}} style={styles.list}
                        trailing={props2 => <FontAwesome name="chevron-right" {...props2} size={14} />}/>}
                        ListEmptyComponent={<Text style={{fontSize: 11, textAlign: 'center'}}>No hay datos...</Text>}
                    />
                </View>
            </View>
        </Modal>:
        <Button autoFocus={false} color="white" title={props.value !== null ? props.data.filter(f => f.value === props.value)[0]?.label:props.title} titleStyle={props.titleStyle}
            onPress={()=>setOpen(true)} trailing={props2 => <FontAwesome name="chevron-down" {...props2} size={14}/>} style={props.buttonStyle} disabled={props.disabled}/>
    )
},(prevProps, nextProps) => {
    if (_.isEqual(prevProps, nextProps)) {
        //console.log("Todo ready")
        return true; // props are equal
    }
    return false; // props are not equal -> update the component
});

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
        width: '75%',
        maxHeight: '60%'
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 5,
        paddingBottom: 20,
        //alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '100%'
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 5,
        textAlign: 'center',
        fontWeight: 'bold'
    },
    list: {
        borderRadius: 20,
    }
});

export default SelectInput;