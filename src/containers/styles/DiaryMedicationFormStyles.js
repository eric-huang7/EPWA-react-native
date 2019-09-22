import { Dimensions, StyleSheet } from "react-native";

import { colors } from "../../themes";

const windowWidth = Dimensions.get("window").width;
const paddingHorizontal = 20;

export default StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  scrollContainer: {
    flexGrow: 1
  },
  rowContainer: {
    flex: 1
  },
  rowFieldsContainer: {
    flex: 1,
    flexDirection: "row"
  },
  flex1Container: {
    flex: 1
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40,
    minHeight: 52,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.mediumPurple,
    marginRight: 5
  },
  fieldText: {
    width: windowWidth - paddingHorizontal * 3
  },
  fieldSectionContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkFilter
  },
  fieldLabel: {
    marginBottom: 5
  },
  dateInput: {
    marginRight: 5,
    backgroundColor: colors.white
  },
  dateInputWithError: {
    backgroundColor: colors.tomato
  },
  removeIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  hasErrors: {
    backgroundColor: colors.tomato
  }
});
