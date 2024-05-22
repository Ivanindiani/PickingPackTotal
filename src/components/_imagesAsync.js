import { useEffect, useState, memo } from "react";
import { Image, StyleSheet, ToastAndroid } from "react-native";
import fetchIvan from "./_fetch";
import _ from 'lodash';

const ImagesAsync = memo(({imageCode, imageStyle = {}, token, ipSelect, msg = true}) => {
    const [imageFull, setImageFull] = useState(null);

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
                    ToastAndroid.SHORT
                );
            }
        })
    }

    return (
        <Image 
            style={[styles.image, imageStyle]}  
            source={
                imageFull ? { uri: imageFull }:require('../assets/images/producto-sin-imagen.png')
            }
            resizeMode="contain"
        />
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