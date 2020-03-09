import React, { Component } from "react";
import {
  Alert,
  Image,
  View,
  ScrollView,
  Text,
} from "react-native";
import HamburgerButton from "../components/HamburgerButton";
import { last } from "ramda";
import { map, forEach } from 'lodash';
import ImageEditor from "@react-native-community/image-editor";

import Button from "../components/Button";

import { colors, fonts } from "../themes";

import horsecropphoto from "../images/epwa/horse_crop_1.png";

import s from "./styles/EPWAStyles";
import {getImageScaleSize} from '../transforms';
import Cropper from '../components/Cropper';
import { cropImages } from '../constants/index';
import {connect} from 'react-redux';
import { setCropPosition } from '../actions/crop';

class EPWACropImage extends Component {
  static navigationOptions = ({ navigation, screenProps }) => ({
    title: screenProps.t("headerBar.syndromes"),
    headerTitleStyle: {
      ...fonts.style.h4,
      fontWeight: "400"
    },
    headerLeft: <HamburgerButton onPress={navigation.openDrawer} />
  });

  get navigation() {
    return this.props.navigation;
  }

  get setFieldValue() {
    return this.props.screenProps.form.setFieldValue;
  }

  getContent = (routeName) => {
    const { t } = this.props.screenProps;
    const { state } = this.props.navigation;
    // const image = state && state.params && state.params.image;
    const lastLetterInRoute = last(routeName).toLowerCase();

    const images = {
      horsecrop: horsecropphoto,
    };

    let desc_content= {};
 
    switch(lastLetterInRoute) {
      case "a":
        desc_content = t("info.epwaphotoupload.forthpage", { returnObjects: true });

        break;
      case "b":
        desc_content = t("info.epwaphotoupload.fifthpage", { returnObjects: true });

        break;
      case "c":
        desc_content = t("info.epwaphotoupload.sixthpage", { returnObjects: true });

        break;
      case "d":
        desc_content = t("info.epwaphotoupload.seventhpage", { returnObjects: true });

        break;
      default:
        desc_content = t("info.epwaphotoupload.forthpage", { returnObjects: true });

        break;
    }

    return {
      fieldName: lastLetterInRoute,
      // image: image,
      title: desc_content.question,
      lbuttonText: desc_content.lbuttonText,
      rbuttonText: desc_content.rbuttonText
    };
  };

  onHandleCrop = (fieldName, hasCropedYes) => {
    const { state } = this.props.navigation;
    this.setFieldValue(fieldName, hasCropedYes);

    if (fieldName === "a") {
      this.navigation.navigate("EPWACropImageB");
      return;
    }

    if (fieldName === "b") {
      this.navigation.navigate("EPWACropImageC");
      return;
    }

    if (fieldName === "c") {
      this.navigation.navigate("EPWACropImageD");
      return;
    }

    if (fieldName === "d") {
      if(hasCropedYes) {
        this.finalCrop();
        this.navigation.navigate("EPWACropImageResult");
      } else {
        this.navigation.navigate("EPWACropImageA")
      }
      return;
    }
  };

  finalCrop = () => {
    const { crops, image = {} } = this.props;
    const images = {};
    forEach(crops, (item, index) => {
      if (!!cropImages[index]) {
        const cropData = {
          offset: {x: item.x, y: item.y},
          size: {width: item.w, height: item.h},
          displaySize: {width: item.w, height: item.h},
          resizeMode: 'contain',
        };
        images[index] = this._crop(image.uri, cropData);
      }
    });
    console.log('final images', images);
    // TODO send images to backend
  };

   _crop = async (uri, cropData) => {
    try {
      const croppedImageURI = await ImageEditor.cropImage(
        uri,
        cropData,
      );
      return croppedImageURI;
    } catch (cropError) {
      return cropError;
    }
  };

  setPosition = (data) => {
    const { dispatch } = this.props;
    const content = this.getContent(this.navigation.state.routeName);

    if (!!cropImages[content.fieldName]) {
      dispatch(setCropPosition({id: content.fieldName, data}))
    }
  };

  render() {
    const { crops, image = {} } = this.props;
    const { t } = this.props.screenProps;
    const content = this.getContent(this.navigation.state.routeName);
    const { imageWidth, imageHeight } = getImageScaleSize(image.width, image.height);
    const coord = cropImages[content.fieldName] || {};

    return (
      <View style={s.mainContainer}>
        <ScrollView
          contentContainerStyle={s.scrollViewContainerStyle}
        >
          <View key={content.title}>
            <Text style={s.titleStyle}>{content.title}</Text>
            <View style={s.cropPhotoContainer}>
              <Image
                source={image}
                style={s.cropImg}
                width={imageWidth}
                height={imageHeight}
              />
              {!!cropImages[content.fieldName]
                ? (<Cropper
                  x={coord.x || 0}
                  y={coord.y * imageHeight || 0}
                  w={coord.w || imageWidth - 48}
                  h={coord.h || imageHeight / 4  }
                  maxWidth={imageWidth}
                  maxHeight={imageHeight}
                  onChange={this.setPosition}
                />)
                : (map(crops, (item, index) => (
                  <Cropper
                    key={index}
                    x={item.x || 0}
                    y={item.y || 0}
                    w={item.w || imageWidth - 48}
                    h={item.h || imageHeight / 4  }
                    maxWidth={imageWidth}
                    maxHeight={imageHeight}
                  />
                )))
              }
            </View>
          </View>
          {content.rbuttonText &&
            <View style={s.photoIsGoodButtonContainer}>
              <Button
                style={s.cropImgLButton}
                label={content.lbuttonText}
                onPress={() => this.onHandleCrop(content.fieldName, false)}
              />
              <Button
                style={s.cropImgRButton}
                label={content.rbuttonText}
                onPress={() => this.onHandleCrop(content.fieldName, true)}
              />
            </View>
          }
          {!content.rbuttonText &&
            <View style={s.cropImgButtonContainer}>
              <Button
                style={s.button}
                label={content.lbuttonText}
                onPress={() => this.onHandleCrop(content.fieldName, true)}
              />
            </View>
          }
        </ScrollView>
      </View>
    );
  }
}

const mapStateToProps = state => ({
  crops: state.crop.crops,
  image: state.crop.image,
});

export default connect(mapStateToProps)(EPWACropImage);
