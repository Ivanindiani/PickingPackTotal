import { StyleSheet, View, Modal } from "react-native";
import Global from "../../app.json";

import _ from 'lodash';
import { Text } from "@react-native-material/core";

const ModalShow = ({children, show, setShow, title = null, style, animationType=null, vertical = 'center', containerStyle}) => {
    return (
        <Modal
            visible={show}
            hardwareAccelerated={true}
            animationType={animationType ?? "fade"}
            transparent={true}
            onBackdropPress={() => {
                console.log("Sasd")
                setShow(false);
            }}
            onRequestClose={() => {
                setShow(false);
            }}
        >
            <View style={[styles.centeredView, {justifyContent: vertical, ...containerStyle}]}>
                <View style={[styles.modalView]}>
                    {title && <View style={styles.headerModal}>
                        <Text style={{color:'white', fontSize: 15, fontWeight: 'bold', textAlign: 'center'}}>{title}</Text>
                    </View>}
                    <View style={[styles.body, style]}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    )
}/*,(prevProps, nextProps) => {
    console.log(prevProps.children, nextProps.children.t);
    if (prevProps.show === nextProps.show && prevProps.children === nextProps.children) {
        return true;
    }
    return false;
})*/;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        alignItems: 'center',
        alignSelf: 'center',
        width: '100%',
        maxHeight: '100%',
        backgroundColor: '#d3d3d373',
        //opacity: 0.5,
        padding: 20
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 50,
        width: '100%'
    },
    headerModal: {
        backgroundColor: Global.colorMundoTotal,
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
        alignItems: 'center',
        padding: 5,
    },
    body: {
        padding: 15,
        maxHeight: '95%'
    }
});

export default ModalShow;