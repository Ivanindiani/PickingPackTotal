import { Text } from '@react-native-material/core';
import { Image, StyleSheet, View } from 'react-native';
import SelectInput from './_virtualSelect';
import { useState } from 'react';

const ipDefaults = [{
    label: '172.16.10.78 (local)',
    value: '172.16.10.78:8888'
}, {
    label: '201.249.133.34 (develop)',
    value: '201.249.133.34:8888'
}, {
    label: '201.249.133.34 (production)',
    value: '201.249.133.34:8899'
}];

const HeaderMundo = (props) => {
    let count = 0;

    //console.log(props);
    const [openAdmin, setAdmin] = useState(false);

    const logoAdmin = () => {
        count++;
        if(count === 10) {
            count = 0;
            setAdmin(true);
        }
    }

    return (
        <View style={styles.container}>
           {/*<Image
                style={styles.image2}
                source={require('../assets/images/gunbarcode.png') }
                resizeMode='center'
            />*/}
            <Text style={styles.text} onPress={logoAdmin}>
                TotalWMS{"\n"}
                <Text style={styles.text2}>{props.title.split("\n")[1]}</Text>
            </Text>
            <View style={{justifyContent: 'center', textAlign: 'center', marginEnd: 5, alignItems: 'center'}}> 
                <Image
                    style={styles.image}
                    source={require('../assets/images/LOGO-MUT.png') }
                    resizeMode='contain'
                />
                {props.dataUser?.USNAA ? <Text style={styles.text3}>{props.dataUser.USNAM+" "+(props.dataUser.USLAS)}</Text>:
                props.dataUser?.CAMIONERO ? <Text style={styles.text3}>Conductor: {props.dataUser.DNAME+" "+(props.dataUser.DFNAM)}</Text>:''}
            </View>
            {openAdmin && <SelectInput
                data={ipDefaults}
                value={props.ipSelect}
                setValue={props.setIp}
                title=""
                buttonStyle={{with: 0, position: 'absolute', visibility: false}}
                open={openAdmin}
                onClose={() => setAdmin(false)}
            />}
        </View>
    )
}

export default HeaderMundo;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        height: 50,
        justifyContent: 'space-between'
    },
    text: {
        //width: 100,
        //marginLeft: 60,
        marginLeft: -5,
        color: 'white',
        fontWeight: 'bold',
        paddingTop: 7,
        alignSelf: 'flex-start' // Vertically center
    },
    text2: {
        fontSize: 14,
        color: 'white',
        fontWeight: '600'
    },  
    text3: {
        fontSize: 10,
        color: 'white',
        fontWeight: '600',
        fontStyle: 'italic'
    },  
    image: {
        height: 35,
    },
    image2: {
        position: 'absolute',
        width: 60,
        height: 60
    }
});