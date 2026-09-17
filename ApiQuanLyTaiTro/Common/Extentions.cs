using Models;
using Models.Request.Base;
using System.Collections;
using System.Data;
using System.Dynamic;
using System.Reflection;
using static Dapper.SqlMapper;

namespace ApiQuanLyTaiTro.Common
{
    /// <summary>
    /// Kho hàm mở rộng (extension methods) dùng chung toàn project. Gồm 3 nhóm chính:
    /// 1) Ép kiểu an toàn: ToInt/ToBool/ToDecimal/MapInt... (không ném lỗi khi dữ liệu xấu).
    /// 2) Chuyển đổi object ↔ DataTable ↔ Table-Valued Parameter (ConvertToDataTable,
    ///    ConvertToTableValuedParameter) — để truyền LIST vào Stored Procedure (vd danh sách id_sv).
    /// 3) Map/CopyProperties (copy field cùng tên giữa 2 model) và CheckInsert/Update/Delete
    ///    (bọc kết quả SP thành Response chuẩn), OrderByVietnameseName (sắp xếp tên tiếng Việt).
    /// Gọi như method của chính object: "123".ToInt(), list.ConvertToDataTable()...
    /// </summary>
    public static partial class Extentions
    {
        public static int MapInt(this object obj)
        {
            try
            {
                if (obj == null) return 0;
                else if (!obj.ToString().IsNumeric()) return 0;
                return obj.ToInt32();
            }
            catch
            {
                return 0;
            }
        }

        public static bool IsNumeric(this string s)
        {
            float output;
            return float.TryParse(s, out output);
        }
        public static int ToInt32(this object obj)
        {
            try
            {
                if (obj == null) return 0;
                return Int32.Parse(obj.ToString().RemoveSpace());
            }
            catch
            {
                throw;
            }
        }
        public static decimal ToDecimal(this object obj)
        {
            try
            {
                if (obj == null) return 0;
                return decimal.Parse(obj.ToString().RemoveSpace());
            }
            catch
            {
                throw;
            }
        }
        public static int ToInt(this object value)
        {
            if (value == null)
            {
                return -1;
            }
            if (value is int)
            {
                return (int)value;
            }
            if (value is string strValue)
            {
                if (int.TryParse(strValue, out int result))
                {
                    return result;
                }
                else
                {
                    throw new FormatException("Giá trị chuỗi không hợp lệ để chuyển sang int.");
                }
            }
            throw new InvalidCastException("Không thể chuyển giá trị này thành int.");
        }
        public static bool ToBool(this object value)
        {
            if (value == null)
            {
                return false;
            }
            if (value is bool)
            {
                return (bool)value;
            }
            if (value is string strValue)
            {
                if (bool.TryParse(strValue, out bool result))
                {
                    return result;
                }
                strValue = strValue.Trim().ToLower();
                if (strValue == "1" || strValue == "true" || strValue == "yes")
                {
                    return true;
                }
                if (strValue == "0" || strValue == "false" || strValue == "no")
                {
                    return false;
                }
                throw new FormatException("Giá trị chuỗi không hợp lệ để chuyển sang bool.");
            }
            if (value is int intValue)
            {
                return intValue != 0;
            }
            throw new InvalidCastException("Không thể chuyển giá trị này thành bool.");
        }
        public static string ConvertToString(this object input)
        {
            try
            {
                if (input != null) return input.ToString();
                return string.Empty;
            }
            catch
            {

                return String.Empty;
            }
        }
        public static string RemoveSpace(this string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            return System.Text.RegularExpressions.Regex.Replace(input.Trim(), @"\s+", " ");
        }
        public static string Join(this IEnumerable<int> list, string separator = ",")
        {
            return string.Join(separator, list);
        }
        public static string Join(this IEnumerable<string> list, string separator = ",")
        {
            return string.Join(separator, list);
        }

        public static bool isDate(this object date)
        {
            DateTime Temp;
            if (date == null) return false;
            if (DateTime.TryParse(date.ToString(), out Temp) == true)
                return true;
            else
                return false;

        }
        public static string GetDanhSachID<T>(this IEnumerable<T> list, string propertyName)
        {
            var propertyInfo = typeof(T).GetProperty(propertyName);
            if (propertyInfo == null)
                return "";

            // Lấy danh sách các giá trị của thuộc tính
            var idList = list.Select(item => propertyInfo.GetValue(item, null)?.ToString()).ToList();

            // Chuyển danh sách thành chuỗi với dấu phẩy phân cách
            return string.Join(",", idList);
        }

        public static object GetPropertyValue(this object obj, string propertyName)
        {
            // Lấy thông tin về thuộc tính từ đối tượng
            PropertyInfo propertyInfo = obj.GetType().GetProperty(propertyName);

            if (propertyInfo != null)
            {
                // Lấy giá trị của thuộc tính
                object value = propertyInfo.GetValue(obj);
                return value?.ToString(); // Nếu giá trị null, trả về null
            }
            else
            {
                // throw new ArgumentException($"Không tìm thấy thuộc tính {propertyName} trong đối tượng.");
            }
            return null;
        }

        public static void SetPropertyValue(this object src, string propName, object value)
        {
            var property = src?.GetType()?.GetProperty(propName);
            if (property != null && property.CanWrite)
            {
                property.SetValue(src, value);
            }
            else
            {
                throw new ArgumentException($"Property '{propName}' not found or not writeable.");
            }
        }

        public static IEnumerable<Dictionary<string, object>> DistinctPropertyValues<T>(this IEnumerable<T> source, params string[] propertyNames)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (propertyNames == null || propertyNames.Length == 0)
                throw new ArgumentException("At least one property name must be specified.", nameof(propertyNames));

            // Dùng case-insensitive HashSet
            var propertyNameSet = new HashSet<string>(propertyNames, StringComparer.OrdinalIgnoreCase);

            // Lấy PropertyInfo tương ứng
            var props = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                                 .Where(p => propertyNameSet.Contains(p.Name))
                                 .ToList();

            if (props.Count != propertyNames.Length)
                throw new ArgumentException("Some property names were not found on type " + typeof(T).Name);

            // Tạo danh sách distinct bằng cách dùng key là chuỗi kết hợp các giá trị
            var seenKeys = new HashSet<string>();
            var results = new List<Dictionary<string, object>>();

            foreach (var item in source)
            {
                var values = props.Select(p => p.GetValue(item)).ToArray();
                var key = string.Join("|", values.Select(v => v?.ToString() ?? ""));

                if (seenKeys.Add(key)) // Nếu key chưa có
                {
                    var dict = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                    for (int i = 0; i < props.Count; i++)
                    {
                        dict[props[i].Name] = values[i];
                    }
                    results.Add(dict);
                }
            }

            return results;
        }

        /// <summary>
        /// Chuyển danh sách bất kỳ thành ExpandoObject với key động: {prefix}{keyField} = valueField
        /// </summary>
        public static ExpandoObject ToDynamicKeyValueObject(
            this IEnumerable dataList,
            string keyField,
            string valueField,
            string prefix = "")
        {
            dynamic result = new ExpandoObject();
            var dict = (IDictionary<string, object>)result;

            foreach (var item in dataList)
            {
                if (item == null) continue;

                var type = item.GetType();

                var keyProp = type.GetProperty(keyField, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                var valueProp = type.GetProperty(valueField, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

                if (keyProp == null || valueProp == null) continue;

                var key = keyProp.GetValue(item)?.ToString();
                var value = valueProp.GetValue(item);

                if (!string.IsNullOrWhiteSpace(key))
                {
                    dict[$"{prefix}{key}"] = value ?? "";
                }
            }

            return result;
        }

        public static async Task<Response> CheckInsert(this Task<int> task)
        {
            Response response = new Response();
            try
            {
                var result = await task;
                if (result > 0)
                {
                    response.data = true;
                    response.message = "Thêm mới thành công!";
                }
                else
                {
                    response.data = false;
                    response.message = "Thêm mới thất bại!";
                }
            }
            catch (Exception ex)
            {
                response.code = ResponseCode.SYSTEM_ERROR;
                response.message = ResponseDetail.SYSTEM_ERRORDETAIL + ": " + ex.Message;
            }
            return response;
        }
        public static async Task<Response> CheckUpdate(this Task<int> task)
        {
            Response response = new Response();
            try
            {
                var result = await task;
                if (result > 0)
                {
                    response.data = true;
                    response.message = "Cập nhật thành công!";
                }
                else
                {
                    response.data = false;
                    response.message = "Cập nhật thất bại!";
                }
            }
            catch (Exception ex)
            {
                response.code = ResponseCode.SYSTEM_ERROR;
                response.message = ResponseDetail.SYSTEM_ERRORDETAIL + ": " + ex.Message;
            }
            return response;
        }
        public static async Task<Response> CheckDelete(this Task<int> task)
        {
            Response response = new Response();
            try
            {
                var result = await task;
                if (result > 0)
                {
                    response.data = true;
                    response.message = "Xoá thành công!";
                }
                else
                {
                    response.data = false;
                    response.message = "Xoá thất bại!";
                }
            }
            catch (Exception ex)
            {
                response.code = ResponseCode.SYSTEM_ERROR;
                response.message = ResponseDetail.SYSTEM_ERRORDETAIL + ": " + ex.Message;
            }
            return response;
        }
        public static TTarget CopyProperties<TSource, TTarget>(this TSource source)
         where TTarget : new()
        {
            var target = new TTarget();
            var sourceProps = typeof(TSource).GetProperties();
            var targetProps = typeof(TTarget).GetProperties();

            foreach (var prop in sourceProps)
            {
                var targetProp = targetProps.FirstOrDefault(x => x.Name == prop.Name);
                if (targetProp != null && targetProp.CanWrite)
                {
                    var sourceValue = prop.GetValue(source);
                    var sourceType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                    var targetType = Nullable.GetUnderlyingType(targetProp.PropertyType) ?? targetProp.PropertyType;

                    if (targetType == sourceType || targetProp.PropertyType.IsAssignableFrom(prop.PropertyType))
                    {
                        targetProp.SetValue(target, sourceValue);
                    }
                    else if (sourceValue != null && targetType.IsAssignableFrom(sourceType))
                    {
                        targetProp.SetValue(target, Convert.ChangeType(sourceValue, targetType));
                    }
                }
            }

            return target;
        }
        /// <summary>
        /// Chuyển danh sách object sang DataTable động (dùng cho table-valued parameter).
        /// </summary>
        /// <typeparam name="T">Kiểu model</typeparam>
        /// <param name="data">Danh sách object</param>
        /// <param name="columnNames">Danh sách tên cột cần lấy (nếu null sẽ lấy tất cả public property)</param>
        /// <returns>DataTable</returns>
        public static DataTable ConvertToDataTable<T>(this IEnumerable<T> data, string[]? columnNames = null)
        {
            var dataTable = new DataTable();
            if (data == null) return dataTable;

            PropertyInfo?[] properties;
            if (columnNames != null)
            {
                properties = columnNames
                    .Select(name => typeof(T).GetProperty(name, BindingFlags.Public | BindingFlags.Instance))
                    .Where(p => p != null && p.CanRead)
                    .ToArray();
            }
            else
            {
                // Sort theo tên cột (case-insensitive) để match thứ tự cột của SQL TVP type — convention từ project TKB
                properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .Where(p => p.CanRead)
                    .OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
                    .ToArray();
            }

            foreach (var prop in properties)
            {
                var propType = Nullable.GetUnderlyingType(prop!.PropertyType) ?? prop.PropertyType;
                dataTable.Columns.Add(prop.Name, propType);
            }

            foreach (var item in data)
            {
                var values = properties.Select(p => p!.GetValue(item) ?? DBNull.Value).ToArray();
                dataTable.Rows.Add(values);
            }

            return dataTable;
        }

        public static ICustomQueryParameter ConvertToTableValuedParameter<T>(this IEnumerable<T> data, string typeName, string[]? columnNames = null)
        {
            return data.ConvertToDataTable(columnNames).AsTableValuedParameter(typeName);
        }
        public static ICustomQueryParameter ConvertToTableValuedParameter<T>(this IEnumerable<T> source, string typeName = "Ids")
        {
            return source.ConvertToDataTable().AsTableValuedParameter(typeName);
        }
        public static ICustomQueryParameter ConvertToTableValuedParameter(this IEnumerable<int> source, string typeName = "Ids")
        {
            return source.ConvertToDataTable().AsTableValuedParameter(typeName);
        }
        public static ICustomQueryParameter ConvertToTableValuedParameter(this IEnumerable<string> source, string typeName = "strIds")
        {
            return source.ConvertToDataTable().AsTableValuedParameter(typeName);
        }
        public static DataTable ConvertToDataTable(this IEnumerable<int> data)
        {
            if (data == null)
            {
                return null;
            }
            DataTable table = new DataTable();
            table.Columns.Add("id", typeof(int));
            foreach (var item in data)
            {
                table.Rows.Add(item);
            }
            return table;
        }
        public static DataTable ConvertToDataTable(this IEnumerable<string> data)
        {
            if (data == null)
            {
                return null;
            }
            DataTable table = new DataTable();
            table.Columns.Add("id", typeof(string));
            foreach (var item in data)
            {
                table.Rows.Add(item);
            }
            return table;
        }
        public static List<T> ConvertDataTableToList<T>(this DataTable table) where T : new()
        {
            var list = new List<T>();

            foreach (DataRow row in table.Rows)
            {
                T obj = new T();
                foreach (var prop in typeof(T).GetProperties())
                {
                    if (table.Columns.Contains(prop.Name) && row[prop.Name] != DBNull.Value)
                    {
                        var propType = prop.PropertyType;
                        var value = row[prop.Name];

                        // Nếu là Nullable, chuyển về kiểu gốc
                        if (Nullable.GetUnderlyingType(propType) != null)
                        {
                            propType = Nullable.GetUnderlyingType(propType);
                        }

                        prop.SetValue(obj, Convert.ChangeType(value, propType));
                    }
                }
                list.Add(obj);
            }

            return list;
        }
        public static DataTable ToDataTable(this DataRow[] rows)
        {
            if (rows == null || rows.Length == 0)
                return new DataTable();

            // Clone cấu trúc từ DataTable gốc
            DataTable dt = rows[0].Table.Clone();

            // Import dữ liệu
            foreach (var row in rows)
            {
                dt.ImportRow(row);
            }

            return dt;
        }
        public static DataTable ToDataTable<T>(this IEnumerable<T> data)
        {
            var dataTable = new DataTable();
            if (data == null) return dataTable;

            // Lấy tất cả property public, readable
            var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
                                      .Where(p => p.CanRead)
                                      .ToArray();

            // Tạo cột cho DataTable
            foreach (var prop in properties)
            {   
                var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                dataTable.Columns.Add(prop.Name, propType);
            }

            // Thêm dữ liệu vào DataTable
            foreach (var item in data)
            {
                var values = new object[properties.Length];
                for (int i = 0; i < properties.Length; i++)
                {
                    values[i] = properties[i].GetValue(item) ?? DBNull.Value;
                }
                dataTable.Rows.Add(values);
            }

            return dataTable;
        }

        public static DataTable ToDataTable<T>(this T obj)
        {
            var dataTable = new DataTable();
            if (obj == null) return dataTable;

            var type = typeof(T);
            var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                                    .Where(p => p.CanRead)
                                    .ToArray();

            // Tạo cột
            foreach (var prop in properties)
            {
                var propType = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                dataTable.Columns.Add(prop.Name, propType);
            }

            // Tạo 1 dòng dữ liệu
            var values = new object[properties.Length];
            for (int i = 0; i < properties.Length; i++)
            {
                values[i] = properties[i].GetValue(obj) ?? DBNull.Value;
            }
            dataTable.Rows.Add(values);

            return dataTable;
        }
 
        public static IdsRequest ToIdsRequest(this int source)
        {
            if (source <= 0) return new IdsRequest { ids = new List<int>() };
            return new IdsRequest
            {
                ids = new List<int> { source }
            };
        }
        public static IdsRequest ToIdsRequest(this string source)
        {
            if (string.IsNullOrEmpty(source) || source == "0") return new IdsRequest { ids = new List<int>() };
            var list = source.Split(",");
            return new IdsRequest
            {
                ids = list.Length == 0 ? new List<int>() : list.Select(x => int.Parse(x)).ToList()
            };
        }

        public static List<int> ToListRequest(this int source)
        {
            if (source <= 0) return new List<int>();
            return new List<int> { source };
        }

        public static List<int> ToListRequest(this string source)
        {
            //if (string.IsNullOrEmpty(source) || source == "0") return new List<int>();
            if (string.IsNullOrEmpty(source)) return new List<int>();
            var list = source.Split(",");
            return list.Length == 0 ? new List<int>() : list.Select(x => int.Parse(x)).ToList();
        }

        public static List<string> ToStrListRequest(this string source)
        {
            if (string.IsNullOrEmpty(source)) return new List<string>();
            return source.Split(",").ToList();
        }

        //public static IdsRequest ToIdsRequest(this List<int> source)
        //{
        //    if (source == null || source.Count == 0) return new IdsRequest { ids = new List<int>() };
        //    return new IdsRequest
        //    {
        //        ids = source
        //    };
        //}
        public static StrIdsRequest ToStrIdsRequest(this string source)
        {
            if (string.IsNullOrEmpty(source)) return new StrIdsRequest { ids = new List<string>() };
            return new StrIdsRequest
            {
                ids = source.Split(",").ToList()
            };
        }

        public static void AddTieuDe(this DataTable dataTable, string name, object value)
        {
            if (dataTable == null) return;
            if (dataTable.Columns.Contains(name))
            {
                return;
            }
            else
            {
                var col = new DataColumn
                {
                    ColumnName = name,
                    DataType = value?.GetType() ?? typeof(object),
                    DefaultValue = value
                };
                dataTable.Columns.Add(col);
            }
           
        }
        public static void AddTieuDe<T>(this IEnumerable<T> list, string propertyName, object value)
        {
            if (list == null) return;

            foreach (var item in list)
            {
                if (item == null) continue;

                if (item is IDictionary<string, object> dict)
                {
                    dict[propertyName] = value;
                }
                else
                {
                    var prop = item.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                    if (prop != null && prop.CanWrite)
                    {
                        prop.SetValue(item, value);
                    }
                }
            }
        }
        public static T Map<T>(this object model) where T : new()
        {
            if (model == null)
                throw new ArgumentNullException(nameof(model));

            T result = new T();

            var targetType = typeof(T);
            var sourceType = model.GetType();

            var sourceProps = sourceType
                .GetProperties()
                .Where(p => p.CanRead)
                .ToDictionary(p => p.Name.ToLower(), p => p);

            foreach (var targetProp in targetType.GetProperties().Where(p => p.CanWrite))
            {
                if (sourceProps.TryGetValue(targetProp.Name.ToLower(), out var sourceProp))
                {
                    var value = sourceProp.GetValue(model);
                    // Kiểm tra type tương thích trước khi gán
                    if (value != null && targetProp.PropertyType.IsAssignableFrom(sourceProp.PropertyType))
                    {
                        targetProp.SetValue(result, value);
                    }
                    else if (value == null && !targetProp.PropertyType.IsValueType)
                    {
                        targetProp.SetValue(result, null);
                    }
                }
            }

            return result;
        }


        /// <summary>
        /// Sắp xếp OrderBy một danh sách theo chuẩn logic Tên Tiếng Việt (Tên -> Họ lót)
        /// </summary>
        public static IOrderedEnumerable<T> OrderByVietnameseName<T>(
                    this IEnumerable<T> source,
                    Func<T, string> hoTenSelector)
                {
                    return source
                        .OrderBy(x => AppCommon.ConvertNameToEnglish(AppCommon.GetName(hoTenSelector(x))))
                        .ThenBy(x => AppCommon.GetName(hoTenSelector(x)))
                        .ThenBy(x => AppCommon.ConvertNameToEnglish(hoTenSelector(x)))
                        .ThenBy(hoTenSelector);
                }

                /// <summary>
                /// Nối tiếp ThenBy một danh sách theo chuẩn logic Tên Tiếng Việt (Tên -> Họ lót)
                /// </summary>
                public static IOrderedEnumerable<T> ThenByVietnameseName<T>(
                    this IOrderedEnumerable<T> source,
                    Func<T, string> hoTenSelector)
                {
                    return source
                        .ThenBy(x => AppCommon.ConvertNameToEnglish(AppCommon.GetName(hoTenSelector(x))))
                        .ThenBy(x => AppCommon.GetName(hoTenSelector(x)))
                        .ThenBy(x => AppCommon.ConvertNameToEnglish(hoTenSelector(x)))
                        .ThenBy(hoTenSelector);
                }

    }
}
