import React, { Component } from "react";
import T from "prop-types";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
  Text,
  Alert,
} from "react-native";
import AlertAsync from "react-native-alert-async";
import { HeaderBackButton } from "react-navigation-stack";
import { FieldArray, withFormik } from "formik";
import { translate } from "react-i18next";
import { connect } from "react-redux";
import { hoistStatics } from "recompose";
import * as yup from "yup";
import {
  format,
  parse,
  getHours,
  getMinutes,
  getTime,
  isValid,
} from "date-fns";
import { get, toNumber } from "lodash";
import {
  __,
  cond,
  equals,
  always,
  compose,
  flatten,
  reject,
  T as ramdaT,
  isNil,
} from "ramda";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import s from "./styles/DiaryMedicationFormStyles";

import Button from "../components/Button";
import MultiLineTextField from "../components/MultiLineTextField";
import DatePicker from "../components/DatePicker";
import FieldSectionHeader from "../components/FieldSectionHeader";
import FieldLabel from "../components/FieldLabel";
import Icon from "../components/Icon";
import PlusSection from "../components/PlusSection";
import Select from "../components/Select";
import SelectButton from "../components/SelectButton";
import SubmitHeaderButton from "../components/SubmitHeaderButton";
import TextInput from "../components/TextInput";
import withAlert from "../components/withAlert";
import withAlertDropdown from "../components/withAlertDropdown";
import withExitPrompt from "../components/withExitPrompt";
import RecurringForm from "../components/RecurringForm";

import { addEvent, editEvent, deleteEvent } from "../actions/events";
import { eventCategories, eventTypes, eventTypeIconNames } from "../constants";
import {
  quantityEventProps,
  quantityEventValidation,
  nameEventValidation,
  quantityWithoutNameEventValidation,
} from "../constants/validationTypes";

import { colors } from "../themes";

import getId from "../services/idGenerator";

import {
  setHours,
  setMinutes,
  setSecondsToZero,
  setMillisecondsToZero,
} from "../services/date";
import iconMap from "../constants/iconMap";
import nlLocale from "date-fns/locale/nl";
import { getStartDateText } from "../helper";

// import Reactotron from "reactotron-react-native";

const validationSchema = yup.object().shape({
  pill: yup.array().of(quantityEventValidation),
  treatment: yup.array().of(nameEventValidation),
  temperature: yup.array().of(quantityWithoutNameEventValidation),
  recovery: yup.array().of(nameEventValidation),
});

class DiaryMedicationForm extends Component {
  static navigationOptions = ({ navigation, screenProps }) => {
    return {
      title: screenProps.t.t("headerBar.diaryMedication"),
      headerLeft: (
        <HeaderBackButton
          title={screenProps.t.t("headerBar.diary")}
          tintColor={colors.nero}
          onPress={navigation.getParam("onBackPress")}
        />
      ),
      headerRight: (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 15, right: 5 }}
            style={{ marginRight: 30 }}
            onPress={() =>
              navigation.navigate("DiaryMedicationFormInfo", {
                animalType: navigation.getParam("animalType"),
              })
            }
          >
            <Icon
              name={iconMap.info2}
              size={30}
              color={colors.egyptianBlueDark}
            />
          </TouchableOpacity>

          {/* <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 15, right: 30 }}
            onPress={navigation.getParam("onSubmitButtonPress")}
          >
            <MaterialIcons
              style={{ marginRight: 10 }}
              name={iconMap.send}
              size={24}
              color={colors.mediumPurple}
            />
          </TouchableOpacity> */}
        </View>
      ),
    };
  };

  constructor(props) {
    super(props);

    const isEditing = Boolean(props.navigation.getParam("initialValue"));
    const localDate = +props.navigation.getParam("localDate") || null;
    const completeEvent = props.navigation.getParam("completeEvent") || false;

    this.state = {
      isEditing,
      localDate,
      completeEvent,
    };

    this.isAndroid = Platform.OS === "android";
  }

  submitForm = () => {
    if (!this.props.dirty && !this.state.completeEvent) {
      return;
    }

    this.props.submitForm();
  };

  getInitialEventValue = (eventType) => {
    const animalId = this.props.navigation.getParam("animalId");

    const event = {
      localId: getId(),
      completed: this.state.completeEvent,
      category: eventCategories.medication,
      type: eventType,
      animalId,
      data: {},
    };

    if (eventType === eventTypes.pill) {
      event.data.unit = "ml";
    }

    if (eventType === eventTypes.treatment) {
      event.data.name = "vet";
    }

    if (eventType === eventTypes.recovery) {
      event.data.name = "";
    }

    if (eventType === eventTypes.temperature) {
      event.data.unit = "celsius";
    }

    return event;
  };

  formatDateField = (timestamp) =>
    isValid(parse(timestamp)) ? format(timestamp, "HH:mm") : "";

  parseDateField = (dateInstance) => {
    // We have to combine picked time with date picked in Diary Screen
    const currentDate = this.props.navigation.getParam("currentDate");
    const pickedTime = {
      hours: getHours(dateInstance),
      minutes: getMinutes(dateInstance),
    };

    return compose(
      getTime,
      setMillisecondsToZero,
      setSecondsToZero,
      setMinutes(__, pickedTime.minutes),
      setHours(__, pickedTime.hours),
      parse
    )(currentDate);
  };

  renderFieldSectionHeader = (fieldName) => (
    <FieldSectionHeader
      title={this.props.t(eventTypes[fieldName])}
      icon={
        <Icon
          name={eventTypeIconNames[fieldName]}
          size={24}
          color={colors.nero}
        />
      }
    />
  );

  renderField = ({ entry, fieldName, index, label, namespace }) => {
    const { i18n, t, errors, setFieldValue } = this.props;
    const fieldPath = `${namespace}[${index}].${fieldName}`;
    const hasErrors = get(errors, fieldPath);
    const currentDate = this.props.navigation.getParam("currentDate");
    let ref;

    return (
      <View style={{ flex: 1, width: "100%" }}>
        <DatePicker
          locale={i18n.language}
          t={t}
          mode='time'
          date={currentDate || new Date()}
          ref={(el) => (ref = el)} // eslint-disable-line no-return-assign
          onPick={(date) => setFieldValue(fieldPath, this.parseDateField(date))}
        />
        <FieldLabel style={s.fieldLabel}>{label}</FieldLabel>
        <SelectButton
          containerStyle={[
            s.dateInput,
            this.props.submitCount > 0 && hasErrors && s.dateInputWithError,
          ]}
          onPress={() => ref.show()}
        >
          {this.formatDateField(entry[fieldName])}
        </SelectButton>
      </View>
    );
  };

  renderTreatmentRow = (props) => {
    const { setFieldValue, t } = this.props;

    const fieldPaths = {
      name: `${props.namespace}[${props.index}].data.name`,
      note: `${props.namespace}[${props.index}].data.note`,
    };

    return (
      <View
        // REMEMBER: In order to not lose focus of fields, the key between rerenders should stay the same!
        // REMEMBER: The key should not be based on array index:
        // if user has two entries, removes the top one,
        // the second one will get values from the top one!
        key={props.entry.id || props.entry.localId}
        style={s.fieldSectionContainer}
      >
        <View style={s.rowContainer}>
          <View style={{ marginBottom: 20 }}>
            {this.renderField({
              fieldName: "startDate",
              label: t("datePicker.titleTime"),
              ...props,
            })}
          </View>
          <View style={[s.rowFieldsContainer, { marginBottom: 10 }]}>
            <View style={s.flex1Container}>
              <FieldLabel style={s.fieldLabel}>{t("treatment")}</FieldLabel>
              <Select
                showBorder
                placeholder={{}}
                items={[
                  { label: t("vet"), value: "vet" },
                  { label: t("physiotherapist"), value: "physiotherapist" },
                  { label: t("osteopath"), value: "osteopath" },
                  { label: t("farrier"), value: "farrier" },
                  { label: t("dentist"), value: "dentist" },
                  { label: t("otherDoctor"), value: "other" },
                ]}
                onValueChange={(value) => setFieldValue(fieldPaths.name, value)}
                value={get(props, "entry.data.name")}
              />
            </View>
          </View>
          <MultiLineTextField
            label={this.props.t("notes")}
            onChangeText={(value) =>
              this.props.setFieldValue(fieldPaths.note, value)
            }
            value={get(props, "entry.data.note")}
            maxLength={280}
          />
        </View>
        <View style={s.removeIconContainer}>
          <TouchableOpacity
            hitSlop={{ left: 20, right: 20, top: 10, bottom: 5 }}
            onPress={() => props.arrayHelpers.remove(props.index)}
          >
            <View>
              <Icon
                name={iconMap.close}
                size={16}
                color={colors.harleyDavidsonOrange}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderRecoveryRow = (props) => {
    const { errors, setFieldValue, t, values } = this.props;

    const fieldPaths = {
      name: `${props.namespace}[${props.index}].data.name`,
    };

    const fieldValues = {
      name: get(values, fieldPaths.name) || "",
    };

    const fieldErrors = {
      name: get(errors, fieldPaths.name),
    };

    const nameFieldLabel = t(`${props.namespace}NameLabel`);

    return (
      <View
        // REMEMBER: In order to not lose focus of fields, the key between rerenders should stay the same!
        // REMEMBER: The key should not be based on array index:
        // if user has two entries, removes the top one,
        // the second one will get values from the top one!
        key={props.entry.id || props.entry.localId}
        style={s.fieldSectionContainer}
      >
        <View style={s.rowContainer}>
          <View style={{ marginBottom: 20 }}>
            {this.renderField({
              fieldName: "startDate",
              label: t("datePicker.titleTime"),
              ...props,
            })}
          </View>
          <View style={[s.flex1Container, { paddingTop: 10 }]}>
            <FieldLabel style={[s.fieldLabel]}>{t(nameFieldLabel)}</FieldLabel>
            <View
              style={[
                s.textInputContainer,
                this.props.submitCount > 0 && fieldErrors.name
                  ? { backgroundColor: colors.tomato }
                  : {},
              ]}
            >
              <TextInput
                maxLength={280}
                onChangeText={(value) => setFieldValue(fieldPaths.name, value)}
                value={fieldValues.name}
                style={
                  this.props.submitCount > 0 && fieldErrors.name
                    ? { backgroundColor: colors.tomato }
                    : {}
                }
              />
            </View>
          </View>
        </View>
        <View style={s.removeIconContainer}>
          <TouchableOpacity
            hitSlop={{ left: 20, right: 20, top: 10, bottom: 5 }}
            onPress={() => props.arrayHelpers.remove(props.index)}
          >
            <View>
              <Icon
                name={iconMap.close}
                size={16}
                color={colors.harleyDavidsonOrange}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderTemperatureRow = (props) => {
    const { errors, setFieldValue, t, values } = this.props;

    const fieldPaths = {
      quantity: `${props.namespace}[${props.index}].data.quantity`,
      unit: `${props.namespace}[${props.index}].data.unit`,
      note: `${props.namespace}[${props.index}].data.note`,
    };

    const fieldValues = {
      quantity: get(values, fieldPaths.quantity) || "",
      unit: get(values, fieldPaths.unit) || "",
      note: get(values, fieldPaths.note) || "",
    };

    const fieldErrors = {
      quantity: get(errors, fieldPaths.quantity),
      unit: get(errors, fieldPaths.unit),
      note: get(errors, fieldPaths.note),
    };

    return (
      <View
        // REMEMBER: In order to not lose focus of fields, the key between rerenders should stay the same!
        // REMEMBER: The key should not be based on array index:
        // if user has two entries, removes the top one,
        // the second one will get values from the top one!
        key={props.entry.id || props.entry.localId}
        style={s.fieldSectionContainer}
      >
        <View style={s.rowContainer}>
          <View style={{ marginBottom: 20 }}>
            {this.renderField({
              fieldName: "startDate",
              label: t("datePicker.titleTime"),
              ...props,
            })}
          </View>
          <View style={[s.rowFieldsContainer, { marginBottom: 10 }]}>
            <View style={s.flex1Container}>
              <FieldLabel style={s.fieldLabel}>{t("temperature")}</FieldLabel>
              <View
                style={[
                  s.textInputContainer,
                  this.props.submitCount > 0 && fieldErrors.quantity
                    ? { backgroundColor: colors.tomato }
                    : {},
                ]}
              >
                <TextInput
                  maxLength={4} // needs 4 chars for example: "39.5"
                  keyboardType='numeric'
                  placeholder='36'
                  onChangeText={(text) =>
                    // Convert comma to a dot - otherwise validation will reject it
                    setFieldValue(fieldPaths.quantity, text.replace(/,/g, "."))
                  }
                  value={`${fieldValues.quantity}`}
                  style={
                    this.props.submitCount > 0 && fieldErrors.quantity
                      ? { backgroundColor: colors.tomato }
                      : {}
                  }
                />
              </View>
            </View>
            <View style={s.flex1Container}>
              <FieldLabel style={s.fieldLabel}>{t("unit")}</FieldLabel>
              <Select
                showBorder
                placeholder={{}}
                items={[
                  { label: t("celsius"), value: "celsius" },
                  { label: t("fahrenheit"), value: "fahrenheit" },
                ]}
                onValueChange={(value) => setFieldValue(fieldPaths.unit, value)}
              />
            </View>
          </View>
          <MultiLineTextField
            label={this.props.t("notes")}
            value={fieldValues.note}
            onChangeText={(value) =>
              this.props.setFieldValue(fieldPaths.note, value)
            }
            maxLength={280}
          />
        </View>
        <View style={s.removeIconContainer}>
          <TouchableOpacity
            hitSlop={{ left: 20, right: 20, top: 10, bottom: 5 }}
            onPress={() => props.arrayHelpers.remove(props.index)}
          >
            <View>
              <Icon
                name={iconMap.close}
                size={16}
                color={colors.harleyDavidsonOrange}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderRow = (props) => {
    const { errors, setFieldValue, t, values } = this.props;

    const fieldPaths = {
      name: `${props.namespace}[${props.index}].data.name`,
      quantity: `${props.namespace}[${props.index}].data.quantity`,
      unit: `${props.namespace}[${props.index}].data.unit`,
      note: `${props.namespace}[${props.index}].data.note`,
    };

    const fieldValues = {
      name: get(values, fieldPaths.name) || "",
      quantity: get(values, fieldPaths.quantity) || "",
      unit: get(values, fieldPaths.unit) || "",
      note: get(values, fieldPaths.note) || "",
    };

    const fieldErrors = {
      name: get(errors, fieldPaths.name),
      quantity: get(errors, fieldPaths.quantity),
      unit: get(errors, fieldPaths.unit),
      note: get(errors, fieldPaths.note),
    };

    const nameFieldLabel = t(`${props.namespace}NameLabel`);

    return (
      <View
        // REMEMBER: In order to not lose focus of fields, the key between rerenders should stay the same!
        // REMEMBER: The key should not be based on array index:
        // if user has two entries, removes the top one,
        // the second one will get values from the top one!
        key={props.entry.id || props.entry.localId}
        style={s.fieldSectionContainer}
      >
        <View style={s.rowContainer}>
          <View style={{ marginBottom: 20 }}>
            {this.renderField({
              fieldName: "startDate",
              label: t("datePicker.titleTime"),
              ...props,
            })}
          </View>
          <View style={s.rowFieldsContainer}>
            <View style={s.flex1Container}>
              <FieldLabel style={s.fieldLabel}>{t("quantity")}</FieldLabel>
              <View
                style={[
                  s.textInputContainer,
                  this.props.submitCount > 0 && fieldErrors.quantity
                    ? { backgroundColor: colors.tomato }
                    : {},
                ]}
              >
                <TextInput
                  keyboardType='numeric'
                  placeholder='10'
                  maxLength={5}
                  onChangeText={(text) =>
                    // Convert comma to a dot - otherwise validation will reject it
                    setFieldValue(
                      fieldPaths.quantity,
                      toNumber(text.replace(/,/g, "."))
                    )
                  }
                  value={`${fieldValues.quantity}`}
                  style={
                    this.props.submitCount > 0 && fieldErrors.quantity
                      ? { backgroundColor: colors.tomato }
                      : {}
                  }
                />
              </View>
            </View>
            <View style={s.flex1Container}>
              <FieldLabel style={s.fieldLabel}>{t("unit")}</FieldLabel>
              <Select
                showBorder
                placeholder={{}}
                items={[
                  { label: t("cubicCentimetre"), value: "cc" },
                  { label: t("gram"), value: "g" },
                  { label: t("scoop"), value: "scoop" },
                  { label: t("sachet"), value: "sachet" },
                  { label: t("tablet"), value: "tablet" },
                  { label: t("byWeight"), value: "for_kg" },
                  { label: t("drop"), value: "drop" },
                ]}
                onValueChange={(value) => setFieldValue(fieldPaths.unit, value)}
                value={fieldValues.unit}
              />
            </View>
          </View>
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <FieldLabel style={[s.fieldLabel]}>{t(nameFieldLabel)}</FieldLabel>
            <View
              style={[
                s.textInputContainer,
                this.props.submitCount > 0 && fieldErrors.name
                  ? { backgroundColor: colors.tomato }
                  : {},
              ]}
            >
              <TextInput
                maxLength={150}
                onChangeText={(value) => setFieldValue(fieldPaths.name, value)}
                value={fieldValues.name}
                style={
                  this.props.submitCount > 0 && fieldErrors.name
                    ? { backgroundColor: colors.tomato }
                    : {}
                }
              />
            </View>
          </View>
          <MultiLineTextField
            label={this.props.t("notes")}
            value={fieldValues.note}
            onChangeText={(value) =>
              this.props.setFieldValue(fieldPaths.note, value)
            }
            maxLength={280}
          />
        </View>
        <View style={s.removeIconContainer}>
          <TouchableOpacity
            hitSlop={{ left: 20, right: 20, top: 10, bottom: 5 }}
            onPress={() => props.arrayHelpers.remove(props.index)}
          >
            <View>
              <Icon
                name={iconMap.close}
                size={16}
                color={colors.harleyDavidsonOrange}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  renderFieldArray = (name) => {
    const { values } = this.props;
    const pushValue = this.getInitialEventValue(eventTypes[name]);

    const shouldRender =
      !this.state.isEditing ||
      (this.state.isEditing &&
        eventTypes[name] ===
          this.props.navigation.getParam("initialValue").type);

    const renderRowFunction = cond([
      [equals(eventTypes.temperature), always(this.renderTemperatureRow)],
      [equals(eventTypes.recovery), always(this.renderRecoveryRow)],
      [equals(eventTypes.treatment), always(this.renderTreatmentRow)],
      [ramdaT, always(this.renderRow)],
    ])(name);

    if (!shouldRender) {
      return null;
    }

    return (
      <FieldArray
        name={eventTypes[name]}
        render={(arrayHelpers) => (
          <View>
            {this.renderFieldSectionHeader(name)}
            {values[name] &&
              values[name].map((entry, index) =>
                renderRowFunction({
                  arrayHelpers,
                  entry,
                  index,
                  namespace: eventTypes[name],
                })
              )}
            {this.state.isEditing ? null : (
              <PlusSection onPress={() => arrayHelpers.push(pushValue)} />
            )}
          </View>
        )}
      />
    );
  };

  renderRecurring = () => {
    const { t, setFieldValue, values, i18n } = this.props;
    const currentDate = this.props.navigation.getParam("currentDate");

    return (
      <RecurringForm
        t={t}
        setFieldValue={setFieldValue}
        values={values}
        currentDate={currentDate}
        i18n={i18n}
      />
    );
  };

  render() {
    const currentDate = this.props.navigation.getParam("currentDate");
    const lang = this.props.i18n.language;
    const renderingDate = this.props.navigation.getParam("renderingDate");
    const btnColor = this.state.completeEvent
      ? { backgroundColor: colors.lima }
      : null;
    const dateForIOS = Date.parse(
      `${renderingDate} ${new Date().getFullYear()}`
    );
    return (
      <View style={s.screenContainer}>
        <KeyboardAvoidingView
          behavior={this.isAndroid ? null : "padding"}
          enabled
          keyboardVerticalOffset={this.isAndroid ? 64 : 80}
        >
          <ScrollView contentContainerStyle={s.scrollContainer}>
            <View>
              <Text
                style={{
                  fontWeight: "400",
                  fontSize: 22,
                  textAlign: "center",
                  marginVertical: 20,
                }}
              >
                {getStartDateText(
                  renderingDate ? +new Date(dateForIOS) : currentDate,
                  lang
                )}
              </Text>
              {this.renderFieldArray(eventTypes.pill)}
              {this.renderFieldArray(eventTypes.treatment)}
              {this.renderFieldArray(eventTypes.temperature)}
              {this.renderFieldArray(eventTypes.recovery)}
            </View>
            {!this.state.completeEvent && this.renderRecurring()}
            <View style={{ padding: 20 }}>
              <Button
                style={{
                  minWidth: 200,
                  marginBottom: 20,
                  ...btnColor,
                }}
                label={
                  this.state.completeEvent
                    ? this.props.t("completeEvent")
                    : this.props.t("save")
                }
                onPress={this.submitForm}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

DiaryMedicationForm.propTypes = {
  dirty: T.bool,
  errors: T.shape({}),
  setFieldValue: T.func,
  submitCount: T.number,
  submitForm: T.func,
  i18n: T.shape({
    language: T.string,
  }),
  t: T.func,
  values: T.shape({
    pill: T.arrayOf(quantityEventProps),
    injection: T.arrayOf(quantityEventProps),
  }),
};

const showSuccess = (alertDropdown, title, msg) => {
  alertDropdown("success", title, msg);
};

const triggerSubmitType = (
  payload,
  { formikBag, actionCreator, initialValue, alertTitle, alertMsg }
) => {
  const { dispatch, t } = formikBag.props;

  showSuccess(formikBag.props.alertDropdown, t(alertTitle), t(alertMsg));

  dispatch(
    actionCreator({
      payload,
      formHelpers: formikBag,
      initialValue,
    })
  );
};

const onSubmit = (values, formikBag) => {
  const t = formikBag.props.t;

  const flattenValues = compose(
    flatten,
    Object.values
  )(values);

  const initialValue = formikBag.props.navigation.getParam("initialValue");
  const completeEvent =
    formikBag.props.navigation.getParam("completeEvent") || false;
  let isEditing = Boolean(initialValue);
  const localDate = formikBag.props.navigation.getParam("localDate");
  const animal = formikBag.props.navigation.getParam("animal");

  if (flattenValues && !flattenValues.length && isEditing) {
    return triggerSubmitType(initialValue, {
      formikBag,
      alertTitle: "alertSuccess",
      alertMsg: "eventDeleteSuccessMsg",
      actionCreator: deleteEvent,
    });
  }

  if (
    flattenValues[0].recurring_untill != "" &&
    flattenValues[0].startDate > flattenValues[0].recurring_untill
  ) {
    Alert.alert("", t("recurringAfterStartDate"));
    return;
  }

  if (completeEvent) {
    flattenValues[0].completed = true;
  }

  for (let i = 0; i < flattenValues.length; i++) {
    if (flattenValues[i].data.notification) {
      flattenValues[i].data.notificationData = `(${t(
        animal && animal.type ? animal.type : "horse"
      )}: ${animal && animal.name ? animal.name : "First Horse"})
       ${t(flattenValues[i].category)} ${t(flattenValues[i].data.quantity)} ${t(
        flattenValues[i].data.unit
      )} `;
    }
  }

  if (!isNil(localDate) && isNil(flattenValues[0].recurring)) {
    flattenValues[0].recurring = null;
    flattenValues[0].recurring_untill = null;
    flattenValues[0].recurringUntill = null;

    return triggerSubmitType(flattenValues[0], {
      formikBag,
      alertTitle: "alertSuccess",
      alertMsg: "eventEditSuccessMsg",
      actionCreator: editEvent,
      initialValue,
    });
  }

  if (!isNil(localDate) && !isNil(flattenValues[0].recurring)) {
    const myAction = async () => {
      const choice = await AlertAsync(
        t("editRecurringEventWarning"),
        t("selectAnOption"),
        [
          { text: t("editRecurring"), onPress: () => "yes" },
          { text: t("newRecurring"), onPress: () => "no" },
          { text: t("cancel"), onPress: () => "cancel" },
        ],
        {
          cancelable: true,
          onDismiss: () => "cancel",
        }
      );
      if (choice === "yes") {
        if (isEditing && flattenValues.length > 0) {
          return await triggerSubmitType(flattenValues[0], {
            formikBag,
            alertTitle: "alertSuccess",
            alertMsg: "eventEditSuccessMsg",
            actionCreator: editEvent,
            initialValue,
          });
        }
      } else if (choice === "no") {
        delete flattenValues[0].id;
        // delete flattenValues[0].recurring;
        // delete flattenValues[0].recurring_untill;
        flattenValues[0].localId = getId();
        return await triggerSubmitType(flattenValues, {
          formikBag,
          alertTitle: "alertSuccess",
          alertMsg: "eventAddSuccessMsg",
          actionCreator: addEvent,
        });
      } else {
        return;
      }
    };
    myAction();
  } else {
    if (!isEditing) {
      return triggerSubmitType(flattenValues, {
        formikBag,
        alertTitle: "alertSuccess",
        alertMsg: "eventAddSuccessMsg",
        actionCreator: addEvent,
      });
    } else if (isEditing && flattenValues.length > 0) {
      return triggerSubmitType(flattenValues[0], {
        formikBag,
        alertTitle: "alertSuccess",
        alertMsg: "eventEditSuccessMsg",
        actionCreator: editEvent,
        initialValue,
      });
    }
    return triggerSubmitType(initialValue, {
      formikBag,
      alertTitle: "alertSuccess",
      alertMsg: "eventDeleteSuccessMsg",
      actionCreator: deleteEvent,
    });
  }
};

const formikOptions = {
  handleSubmit: onSubmit,
  mapPropsToValues: (props) => {
    const initialValue = props.navigation.getParam("initialValue");

    if (!initialValue) {
      return {};
    }
    const result = {};
    result[initialValue.type] = [initialValue];

    return result;
  },
  validationSchema,
};

export default hoistStatics(
  compose(
    connect(),
    translate("root"),
    withAlert,
    withAlertDropdown,
    withFormik(formikOptions),
    // Has to be below withFormik
    withExitPrompt
  )
)(DiaryMedicationForm);
