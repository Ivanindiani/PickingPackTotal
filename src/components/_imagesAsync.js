import { useEffect, useState, memo } from "react";
import { Image, StyleSheet, ToastAndroid, TouchableOpacity } from "react-native";
import fetchIvan from "./_fetch";
import _ from 'lodash';
import { launchCamera } from "react-native-image-picker";
import { Button, VStack } from "@react-native-material/core";

const ImagesAsync = memo(({imageCode, imageStyle = {}, token, ipSelect, msg = true, upload = false}) => {
    const [imageFull, setImageFull] = useState(null);
    const [confirmar, setConfirmar] = useState(0);

    useEffect(() => {
        console.log("Hola soy la imagen", imageCode, imageStyle);
        if(imageCode) {
            getImage();
        }
    }, [imageCode]);

    const getImage = () => {
        //imageSave = null;
        setImageFull(null);
        fetchIvan(ipSelect).get('/getImage', "code="+imageCode, token)
        .then(({data}) => {
            if(data.data) {
                console.log("Get image lengths", data.data.length);
                setImageFull(data.data);
                //imageSave = data.data;
            }
        })
        .catch(({status, error}) => {
            //console.log(error);
            if(msg) {
                return ToastAndroid.show(
                    error?.text || error?.message || (error && error?.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                    ToastAndroid.LONG
                );
            }
        })
    }

    const takeFoto = () => {
        console.log(imageCode)
        launchCamera({ 
            mediaType: 'photo', 
            includeBase64: true 
        }, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
            } else {
                let foto = response.assets[0];
                let base = foto.base64;
                if(!base) return ToastAndroid.show('Error intente nuevamente', ToastAndroid.SHORT);
                let size = foto.fileSize;
                //console.log(size, checkMbFile(base));
                
                if(((size / 1024) / 1024) > 50) return ToastAndroid.show('El archivo no debe superar 50 MB', ToastAndroid.SHORT);
                //if(checkMbFile(base) > 50) return ToastAndroid.show('El archivo no debe superar 50 MB', ToastAndroid.SHORT);
                
                /*let fileData = {
                    file: base,
                    extension: foto.type.split('/')[1] ?? 'png',
                    MATNR: imageCode
                }*/
                
                setImageFull("data:image/jpeg;base64,"+base);
                setConfirmar(1);
            }
        });
    }
    const uploadImage = () => {
        setConfirmar(2);

        let fileData = {
            MATNR: imageCode,
            file: imageFull.replace("data:image/jpeg;base64,", "")
        }
        fetchIvan(ipSelect).post('/uploadImage', fileData, token)
        .then(({data}) => {
            console.log(data);
            ToastAndroid.show("Imagen cargada con éxito", ToastAndroid.LONG);
            setConfirmar(0);
        })
        .catch(({status, error}) => {
            console.log(error);
            setConfirmar(1);
            return ToastAndroid.show(
                error?.text || error?.message || (error && error?.indexOf("request failed") !== -1 ? "Por favor chequea la conexión a internet":"Error interno, contacte a administrador"),
                ToastAndroid.LONG
            );
        });
    }
    return (
        imageFull && !confirmar ? 
            <Image 
                style={[styles.image, imageStyle]}  
                source={{ uri: imageFull }}
                resizeMode="contain"
            />:
        <VStack style={{justifyContent: 'center', gap: 2, textAlign: 'center'}}>
            <TouchableOpacity onPress={() => upload && takeFoto()}>
                <Image 
                    style={[styles.image, imageStyle]}  
                    source={imageFull ? { uri: imageFull }:(upload ? require('../assets/images/producto-sin-imagen2.jpg'):require('../assets/images/producto-sin-imagen1.jpg'))}
                    resizeMode="contain"
                />
            </TouchableOpacity>
            {confirmar > 0 ? <Button disabled={confirmar===2} 
                                    loading={confirmar===2}
                                    loadingIndicatorPosition="overlay"
                                    onPress={uploadImage} 
                                    compact title="Actualizar foto" 
                                    titleStyle={{textAlign: 'center', fontSize: 11}} 
                                    color="secondary" tintColor="white"/>:''}
        </VStack>
    )
},(prevProps, nextProps) => {
    //console.log("IMAGEN MEMa: ",prevProps.imageCode === nextProps.imageCode,_.isEqual(prevProps.imageStyle, nextProps.imageStyle),prevProps.token === nextProps.token)

    if (prevProps.imageCode === nextProps.imageCode &&
        _.isEqual(prevProps.imageStyle, nextProps.imageStyle) &&
        prevProps.token === nextProps.token) {
        return true; // props are equal
    }
    return false; // props are not equal -> update the component
})

export default ImagesAsync;


const styles = StyleSheet.create({
    image: {
        width: 'auto',
        height: 110,
        transform: [{scale: 1}],
    }
})