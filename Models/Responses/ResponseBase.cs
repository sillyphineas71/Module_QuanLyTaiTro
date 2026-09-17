using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Models
{
    [Serializable]
    public class ResponseBase<T>
    {
        public bool is_success { get; set; } = true;
        public string code { get; set; } = ResponseCode.SUCCESS;
        public string message { get; set; } = ResponseDetail.SUCCESSDETAIL;
        public T? data { get; set; }
        public ResponseBase() { }
        public ResponseBase(T data = default(T))
        {
            this.data = data;
        }
        public ActionResult ToActionResult()
        {
            if (this.code == ResponseCode.SUCCESS)
                return new OkObjectResult(this);
            return new BadRequestObjectResult(this);
            //return response.code switch
            //{
            //    ResponseCode.NOT_FOUND => new NotFoundObjectResult(response),
            //    ResponseCode.BAD_REQUEST => new BadRequestObjectResult(response),
            //    ResponseCode.UNAUTHORIZED => new UnauthorizedObjectResult(response),
            //    _ => new StatusCodeResult(500)
            //};
        }
        public ContentResult ToContentResult()
        {
            var jsonSettings = new JsonSerializerSettings
            {
                ContractResolver = new IgnorePropsResolver(new[] { "is_deleted", "created_time", "created_user_id", "last_modified_times", "last_modified_user_id" }),
                Formatting = Formatting.None
            };
            return new ContentResult()
            {
                StatusCode = (int)(this.code == ResponseCode.SUCCESS ? HttpStatusCode.OK : HttpStatusCode.BadRequest),
                Content = Newtonsoft.Json.JsonConvert.SerializeObject(this, jsonSettings),
                ContentType = "json"
            };
        }

        public ContentResult ToFullInfoResult()
        {
            var jsonSettings = new JsonSerializerSettings
            {
                ContractResolver = new IgnorePropsResolver(new[] { "" }),
                Formatting = Formatting.None
            };
            return new ContentResult()
            {
                StatusCode = (int)(this.code == ResponseCode.SUCCESS ? HttpStatusCode.OK : HttpStatusCode.BadRequest),
                Content = Newtonsoft.Json.JsonConvert.SerializeObject(this, jsonSettings),
                ContentType = "json"
            };
        }
    }
    public class ResponeBaseSuccess : ResponseBase<object>
    {

        public ResponeBaseSuccess(object data, string message = "")
        {
            this.is_success = true;
            this.code = ResponseCode.SUCCESS;
            this.message = ResponseDetail.SUCCESSDETAIL;
            this.data = data;
        }
        public ResponeBaseSuccess(string message = "")
        {
            this.is_success = true;
            this.code = ResponseCode.SUCCESS;
            this.message = message;
            this.data = null;
        }
    }
    public class ResponeBaseErr : ResponseBase<object>
    {
        public ResponeBaseErr(string message = "")
        {
            this.is_success = false;
            this.code = ResponseCode.SYSTEM_ERROR;
            this.message = message;
        }
    }

    public class IgnorePropsResolver : DefaultContractResolver
    {
        private readonly HashSet<string> _propsToIgnore;

        public IgnorePropsResolver(IEnumerable<string> propsToIgnore)
        {
            _propsToIgnore = new HashSet<string>(propsToIgnore, StringComparer.OrdinalIgnoreCase);
        }

        protected override JsonProperty CreateProperty(System.Reflection.MemberInfo member, MemberSerialization memberSerialization)
        {
            var property = base.CreateProperty(member, memberSerialization);
            if (_propsToIgnore.Contains(property.PropertyName))
            {
                property.ShouldSerialize = _ => false;
            }
            return property;
        }
    }
}
